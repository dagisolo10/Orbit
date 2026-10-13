import type { ProjectOpenTarget } from "@shared/types/project";
import { spawn } from "child_process";
import { shell } from "electron";
import { stat } from "fs/promises";
import path from "path";

/**
 * Opens a scanned project in an external editor, terminal, or file manager.
 *
 * Filesystem access and process spawning stay in the main process; the renderer
 * only passes a project path and a target. Candidates are probed in order and
 * the first available application wins, so nothing is assumed about the host.
 */

export class ProjectActionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "ProjectActionError";
    }
}

type Candidate = {
    command: string;
    args: string[];
    shell?: boolean;
    /** Some launchers (`open -a`, `wt -d`, `cmd`) expect the directory as an argument. */
    appendPath?: boolean;
};

async function assertDirectory(projectPath: string): Promise<void> {
    if (typeof projectPath !== "string" || projectPath.trim().length === 0 || !path.isAbsolute(projectPath)) {
        throw new ProjectActionError("That project path is not valid.");
    }

    try {
        const info = await stat(projectPath);

        if (!info.isDirectory()) {
            throw new Error("not a directory");
        }
    } catch {
        throw new ProjectActionError("That project folder could not be found.");
    }
}

export async function openProject(projectPath: string, target: ProjectOpenTarget): Promise<void> {
    await assertDirectory(projectPath);

    switch (target) {
        case "editor":
            await openInEditor(projectPath);
            return;
        case "terminal":
            await openInTerminal(projectPath);
            return;
        case "file-manager":
            shell.showItemInFolder(projectPath);
            return;
        default:
            throw new ProjectActionError("Orbit does not support that action.");
    }
}

function envCandidates(): Candidate[] {
    // Editor env vars may embed arguments (`code --wait`), so split the command
    // from its flags and pass the project path as the final argument. This avoids
    // running through a shell, which would hide "command not found" errors.
    return [process.env["VISUAL"], process.env["EDITOR"]]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map((value) => {
            const [command, ...args] = value.trim().split(/\s+/);
            return { command, args, appendPath: true };
        });
}

function editorCandidates(): Candidate[] {
    if (process.platform === "darwin") {
        return [
            { command: "open", args: ["-a", "Visual Studio Code"], appendPath: true },
            { command: "open", args: ["-a", "Cursor"], appendPath: true },
            { command: "open", args: ["-a", "Sublime Text"], appendPath: true },
        ];
    }

    return [
        { command: "code", args: [] },
        { command: "codium", args: [] },
        { command: "code-insiders", args: [] },
        { command: "cursor", args: [] },
        { command: "windsurf", args: [] },
        { command: "subl", args: [] },
    ];
}

function terminalCandidates(): Candidate[] {
    if (process.platform === "darwin") {
        return [
            { command: "open", args: ["-a", "Terminal"], appendPath: true },
            { command: "open", args: ["-a", "iTerm"], appendPath: true },
        ];
    }

    if (process.platform === "win32") {
        return [
            { command: "wt", args: ["-d"], appendPath: true },
            { command: "cmd.exe", args: ["/c", "start", "", "cmd", "/K", "cd", "/d"], appendPath: true },
        ];
    }

    return [
        { command: "xdg-terminal-exec", args: [] },
        { command: "gnome-terminal", args: [] },
        { command: "konsole", args: [] },
        { command: "xfce4-terminal", args: [] },
        { command: "alacritty", args: [] },
        { command: "kitty", args: [] },
        { command: "wezterm", args: ["start"] },
        { command: "foot", args: [] },
        { command: "tilix", args: [] },
        { command: "x-terminal-emulator", args: [] },
        { command: "xterm", args: [] },
    ];
}

async function openInEditor(projectPath: string): Promise<void> {
    for (const candidate of [...envCandidates(), ...editorCandidates()]) {
        if (await trySpawn(candidate, projectPath)) return;
    }

    throw new ProjectActionError("No code editor was found. Install VS Code, or set the EDITOR or VISUAL environment variable.");
}

async function openInTerminal(projectPath: string): Promise<void> {
    for (const candidate of terminalCandidates()) {
        if (await trySpawn(candidate, projectPath)) return;
    }

    throw new ProjectActionError("No supported terminal emulator was found on this system.");
}

function trySpawn(candidate: Candidate, cwd: string): Promise<boolean> {
    return new Promise((resolve) => {
        let settled = false;

        const finish = (ok: boolean, child?: ReturnType<typeof spawn>) => {
            if (settled) return;
            settled = true;
            if (ok && child) child.unref();
            resolve(ok);
        };

        const args = candidate.appendPath ? [...candidate.args, cwd] : candidate.args;

        try {
            const child = spawn(candidate.command, args, { cwd, detached: true, stdio: "ignore", shell: candidate.shell ?? false });
            child.once("error", () => finish(false));
            child.once("spawn", () => finish(true, child));
        } catch {
            finish(false);
        }
    });
}
