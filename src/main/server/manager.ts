import { parseCommandLine, resolveCommand } from "@main/launcher/apps";
import { SERVER_LOG_LIMIT, type ServerEvent, type ServerLogLine, type ServerLogStream, type ServerProject, type ServerRuntimeState } from "@shared/types/server";
import { spawn, type ChildProcess } from "child_process";
import { stat } from "fs/promises";

/**
 * Owns the lifecycle of every development server process.
 *
 * Everything here stays in the main process: the renderer never sees a
 * `ChildProcess`, only serializable status and log lines. Commands are
 * tokenized and spawned without a shell, and each server runs in its own
 * process group so stopping or restarting it also reaps the children that dev
 * tooling (npm/pnpm/vite/bun) tends to spawn.
 *
 * Operations for a single server are serialized through a promise queue so a
 * rapid start/stop/restart can never race and leave a stray process behind.
 */

const STOP_GRACE_MS = 5000;

// Strips ANSI colour/control sequences so terminal output stays readable.
// eslint-disable-next-line no-control-regex
const ANSI_PATTERN = /[\u001B\u009B][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g;
const CONTROL_PATTERN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

// Local dev URLs only: localhost, loopback, and private network addresses.
const URL_PATTERN =
    /\bhttps?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1?\]|(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/[^\s'"]*)?/gi;

type RunningProcess = {
    child: ChildProcess;
    stopRequested: boolean;
    /** Buffer for a partial line that has not yet ended in a newline. */
    stdoutRemainder: string;
    stderrRemainder: string;
    killTimer: ReturnType<typeof setTimeout> | null;
    /** Maps a port (or full URL) to the URL shown for it, to de-duplicate output. */
    urls: Map<string, string>;
};

function sanitize(text: string): string {
    return text.replace(ANSI_PATTERN, "").replace(CONTROL_PATTERN, "");
}

function defaultState(id: string): ServerRuntimeState {
    return { id, status: "stopped", pid: null, startedAt: null, exitCode: null, signal: null, error: null, urls: [] };
}

async function isDirectory(target: string): Promise<boolean> {
    try {
        const info = await stat(target);
        return info.isDirectory();
    } catch {
        return false;
    }
}

/** Quotes a token for the Windows `cmd.exe /c` wrapper used for `.cmd`/`.bat`. */
function quoteWindowsArg(value: string): string {
    return `"${value.replace(/"/g, '""')}"`;
}

export class ServerManager {
    private readonly states = new Map<string, ServerRuntimeState>();
    private readonly processes = new Map<string, RunningProcess>();
    private readonly logs = new Map<string, ServerLogLine[]>();
    private readonly sequences = new Map<string, number>();
    private readonly queues = new Map<string, Promise<unknown>>();
    private readonly pendingLogs = new Map<string, ServerLogLine[]>();
    private flushScheduled = false;

    constructor(private readonly emit: (event: ServerEvent) => void) {}

    ensureState(id: string): ServerRuntimeState {
        let state = this.states.get(id);
        if (!state) {
            state = defaultState(id);
            this.states.set(id, state);
        }
        return state;
    }

    getState(id: string): ServerRuntimeState {
        return this.ensureState(id);
    }

    allStates(): ServerRuntimeState[] {
        return [...this.states.values()];
    }

    getLogs(id: string): ServerLogLine[] {
        return this.logs.get(id) ?? [];
    }

    allLogs(): Record<string, ServerLogLine[]> {
        const result: Record<string, ServerLogLine[]> = {};
        for (const [id, lines] of this.logs) result[id] = lines;
        return result;
    }

    clearLogs(id: string): void {
        this.logs.set(id, []);
    }

    start(project: ServerProject): Promise<ServerRuntimeState> {
        return this.enqueue(project.id, () => this.doStart(project));
    }

    stop(id: string): Promise<ServerRuntimeState> {
        return this.enqueue(id, () => this.doStop(id));
    }

    restart(project: ServerProject): Promise<ServerRuntimeState> {
        return this.enqueue(project.id, async () => {
            await this.doStop(project.id);
            return this.doStart(project);
        });
    }

    /** Stops (if running) and forgets a server, dropping its state and logs. */
    forget(id: string): Promise<void> {
        return this.enqueue(id, async () => {
            await this.doStop(id);
            this.states.delete(id);
            this.logs.delete(id);
            this.sequences.delete(id);
            this.pendingLogs.delete(id);
            this.emit({ type: "removed", serverId: id });
        });
    }

    /** Kills every running server immediately. Used on app shutdown. */
    dispose(): void {
        for (const [id, entry] of this.processes) {
            entry.stopRequested = true;
            this.killTree(entry.child, "SIGKILL");
            this.ensureState(id);
        }
        this.processes.clear();
    }

    private enqueue<T>(id: string, task: () => Promise<T>): Promise<T> {
        const previous = this.queues.get(id) ?? Promise.resolve();
        const next = previous.then(task, task);
        this.queues.set(
            id,
            next.catch(() => undefined),
        );
        return next;
    }

    private setState(id: string, patch: Partial<ServerRuntimeState>): ServerRuntimeState {
        const next: ServerRuntimeState = { ...this.ensureState(id), ...patch };
        this.states.set(id, next);
        this.emit({ type: "state", state: next });
        return next;
    }

    private appendLog(id: string, stream: ServerLogStream, text: string): void {
        const sequence = (this.sequences.get(id) ?? 0) + 1;
        this.sequences.set(id, sequence);

        const line: ServerLogLine = { seq: sequence, stream, text, at: Date.now() };

        const lines = this.logs.get(id) ?? [];
        lines.push(line);
        if (lines.length > SERVER_LOG_LIMIT) lines.splice(0, lines.length - SERVER_LOG_LIMIT);
        this.logs.set(id, lines);

        const pending = this.pendingLogs.get(id) ?? [];
        pending.push(line);
        this.pendingLogs.set(id, pending);

        if (!this.flushScheduled) {
            this.flushScheduled = true;
            setImmediate(() => this.flushLogs());
        }
    }

    private flushLogs(): void {
        this.flushScheduled = false;
        for (const [serverId, lines] of this.pendingLogs) {
            if (lines.length > 0) this.emit({ type: "log", serverId, lines });
        }
        this.pendingLogs.clear();
    }

    private fail(id: string, message: string): ServerRuntimeState {
        this.appendLog(id, "system", `✖ ${message}`);
        return this.setState(id, { status: "failed", pid: null, startedAt: null, exitCode: null, signal: null, error: message, urls: [] });
    }

    private async doStart(project: ServerProject): Promise<ServerRuntimeState> {
        // Already running (or starting): starting again is a no-op.
        if (this.processes.has(project.id)) return this.getState(project.id);

        if (!(await isDirectory(project.path))) {
            return this.fail(project.id, `Project folder not found: ${project.path}`);
        }

        const tokens = parseCommandLine(project.command);
        if (tokens.length === 0) {
            return this.fail(project.id, "The startup command is empty.");
        }

        const [command, ...args] = tokens;
        const executable = await resolveCommand(command);
        if (!executable) {
            return this.fail(project.id, `Command not found: ${command}. Check that it is installed and on your PATH.`);
        }

        this.setState(project.id, { status: "starting", pid: null, startedAt: null, exitCode: null, signal: null, error: null, urls: [] });
        this.appendLog(project.id, "system", `$ ${project.command}`);

        let child: ChildProcess;
        try {
            const spawnSpec = this.buildSpawn(executable, args);
            child = spawn(spawnSpec.command, spawnSpec.args, {
                cwd: project.path,
                shell: false,
                detached: process.platform !== "win32",
                windowsHide: true,
                windowsVerbatimArguments: spawnSpec.windowsVerbatimArguments,
                stdio: ["ignore", "pipe", "pipe"],
                env: process.env,
            });
        } catch (error) {
            return this.fail(project.id, error instanceof Error ? error.message : "Orbit could not start that command.");
        }

        const entry: RunningProcess = {
            child,
            stopRequested: false,
            stdoutRemainder: "",
            stderrRemainder: "",
            killTimer: null,
            urls: new Map(),
        };
        this.processes.set(project.id, entry);

        return new Promise<ServerRuntimeState>((resolve) => {
            let settled = false;
            const settle = (state: ServerRuntimeState) => {
                if (settled) return;
                settled = true;
                resolve(state);
            };

            child.once("spawn", () => {
                settle(this.setState(project.id, { status: "running", pid: child.pid ?? null, startedAt: Date.now(), error: null }));
            });

            child.once("error", (error) => {
                this.processes.delete(project.id);
                settle(this.fail(project.id, error.message));
            });

            child.stdout?.on("data", (chunk: Buffer) => this.handleData(project.id, "stdout", chunk));
            child.stderr?.on("data", (chunk: Buffer) => this.handleData(project.id, "stderr", chunk));

            child.once("close", (code, signal) => {
                if (entry.killTimer) clearTimeout(entry.killTimer);
                this.flushRemainder(project.id, entry);
                this.processes.delete(project.id);

                if (entry.stopRequested) {
                    this.appendLog(project.id, "system", `■ Stopped${signal ? ` (${signal})` : ""}`);
                    settle(this.setState(project.id, { status: "stopped", pid: null, exitCode: code, signal, error: null }));
                    return;
                }

                const reason = code !== null ? `exited with code ${code}` : signal ? `was terminated (${signal})` : "exited unexpectedly";
                this.appendLog(project.id, "system", `✖ Process ${reason}`);
                settle(this.setState(project.id, { status: "failed", pid: null, exitCode: code, signal, error: `The process ${reason}.` }));
            });
        });
    }

    private async doStop(id: string): Promise<ServerRuntimeState> {
        const entry = this.processes.get(id);

        if (!entry) {
            // Nothing running; make sure the surface state reflects that.
            const state = this.getState(id);
            if (state.status === "running" || state.status === "starting" || state.status === "stopping") {
                return this.setState(id, { status: "stopped", pid: null });
            }
            return state;
        }

        entry.stopRequested = true;
        this.setState(id, { status: "stopping" });

        return new Promise<ServerRuntimeState>((resolve) => {
            let settled = false;
            const settle = () => {
                if (settled) return;
                settled = true;
                resolve(this.getState(id));
            };

            entry.child.once("close", settle);

            // The process may have exited between the lookup above and here.
            if (entry.child.exitCode !== null || entry.child.signalCode !== null) {
                settle();
                return;
            }

            this.killTree(entry.child, "SIGTERM");

            entry.killTimer = setTimeout(() => {
                this.killTree(entry.child, "SIGKILL");
            }, STOP_GRACE_MS);
        });
    }

    private handleData(id: string, stream: "stdout" | "stderr", chunk: Buffer): void {
        const entry = this.processes.get(id);
        if (!entry) return;

        const key = stream === "stdout" ? "stdoutRemainder" : "stderrRemainder";
        const combined = entry[key] + sanitize(chunk.toString("utf8"));
        const parts = combined.split("\n");

        // The trailing element is an unterminated line kept for the next chunk.
        entry[key] = parts.pop() ?? "";

        for (const part of parts) {
            const text = part.replace(/\r/g, "");
            this.appendLog(id, stream, text);
            this.detectUrls(id, entry, text);
        }
    }

    private flushRemainder(id: string, entry: RunningProcess): void {
        if (entry.stdoutRemainder.length > 0) {
            const text = entry.stdoutRemainder.replace(/\r/g, "");
            this.appendLog(id, "stdout", text);
            this.detectUrls(id, entry, text);
            entry.stdoutRemainder = "";
        }
        if (entry.stderrRemainder.length > 0) {
            const text = entry.stderrRemainder.replace(/\r/g, "");
            this.appendLog(id, "stderr", text);
            this.detectUrls(id, entry, text);
            entry.stderrRemainder = "";
        }
    }

    private detectUrls(id: string, entry: RunningProcess, text: string): void {
        const matches = text.match(URL_PATTERN);
        if (!matches) return;

        let changed = false;
        for (const raw of matches) {
            const url = raw.replace(/[)\].,;]+$/, "");
            if (url.length === 0) continue;

            let key: string;
            try {
                const parsed = new URL(url);
                key = parsed.port || url;
            } catch {
                key = url;
            }

            if (entry.urls.has(key)) continue;
            entry.urls.set(key, url);
            changed = true;
        }

        if (changed) {
            this.setState(id, { urls: [...entry.urls.values()] });
        }
    }

    private killTree(child: ChildProcess, signal: NodeJS.Signals): void {
        const pid = child.pid;
        if (pid === undefined) return;

        if (process.platform === "win32") {
            spawn("taskkill", ["/pid", String(pid), "/T", "/F"], { windowsHide: true, shell: false });
            return;
        }

        try {
            // Negative pid targets the whole process group (the child is detached).
            process.kill(-pid, signal);
        } catch {
            try {
                child.kill(signal);
            } catch {
                // The process already exited; nothing to do.
            }
        }
    }

    private buildSpawn(executable: string, args: string[]): { command: string; args: string[]; windowsVerbatimArguments?: boolean } {
        if (process.platform === "win32" && /\.(cmd|bat)$/i.test(executable)) {
            // `.cmd`/`.bat` shims cannot be spawned directly without a shell.
            const comSpec = process.env["ComSpec"] ?? "cmd.exe";
            const line = [executable, ...args].map(quoteWindowsArg).join(" ");
            return { command: comSpec, args: ["/d", "/s", "/c", `"${line}"`], windowsVerbatimArguments: true };
        }

        return { command: executable, args };
    }
}

export function isLocalUrl(value: string): boolean {
    try {
        const url = new URL(value);
        if (url.protocol !== "http:" && url.protocol !== "https:") return false;
        const host = url.hostname;
        if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1") return true;
        if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return true;
        return false;
    } catch {
        return false;
    }
}
