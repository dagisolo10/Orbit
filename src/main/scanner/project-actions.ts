import { findPreset, parseCommandLine, resolvePreference } from "@main/launcher/apps";
import type { LaunchKind, LaunchPreference, LaunchPreferences } from "@shared/types/settings";
import type { ProjectOpenTarget } from "@shared/types/project";
import { spawn } from "child_process";
import { shell } from "electron";
import { stat } from "fs/promises";
import path from "path";

/**
 * Opens a scanned project in an external editor, terminal, or file manager.
 *
 * Filesystem access and process spawning stay in the main process; the renderer
 * only passes a project path and a target. When the user has chosen a preferred
 * application it is used directly; otherwise candidates are probed in order and
 * the first available application wins, so nothing is assumed about the host.
 *
 * No spawn ever runs through a shell, so arguments (including user-configured
 * custom commands) can never be interpreted as shell syntax.
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

export async function openProject(projectPath: string, target: ProjectOpenTarget, preferences?: LaunchPreferences): Promise<void> {
    await assertDirectory(projectPath);

    switch (target) {
        case "editor":
            await openTarget("editor", projectPath, preferences?.editor);
            return;
        case "terminal":
            await openTarget("terminal", projectPath, preferences?.terminal);
            return;
        case "file-manager":
            shell.showItemInFolder(projectPath);
            return;
        default:
            throw new ProjectActionError("Orbit does not support that action.");
    }
}

async function openTarget(kind: LaunchKind, projectPath: string, preference: LaunchPreference | undefined): Promise<void> {
    // An explicit choice is honored strictly: if it can no longer be launched we
    // report that instead of silently opening a different application.
    if (preference && preference.mode !== "auto") {
        const resolved = await resolvePreference(preference, kind, projectPath, projectPath);

        if (!resolved) {
            throw new ProjectActionError(`Orbit could not launch ${preferenceLabel(kind, preference)}. It may have moved or been uninstalled — choose another application in Settings.`);
        }

        const launched = await trySpawn({ command: resolved.command, args: resolved.args }, resolved.cwd);
        if (!launched) {
            throw new ProjectActionError(`Orbit could not launch ${preferenceLabel(kind, preference)}. Check that it is installed and try again.`);
        }
        return;
    }

    const candidates = kind === "editor" ? [...envCandidates(), ...editorCandidates()] : terminalCandidates(projectPath);
    for (const candidate of candidates) {
        if (await trySpawn(candidate, projectPath)) return;
    }

    throw new ProjectActionError(
        kind === "editor" ? "No code editor was found. Install VS Code, or set the EDITOR or VISUAL environment variable." : "No supported terminal emulator was found on this system.",
    );
}

function preferenceLabel(kind: LaunchKind, preference: LaunchPreference): string {
    if (preference.mode === "preset") {
        return findPreset(kind, preference.id)?.label ?? "your preferred application";
    }
    if (preference.mode === "custom") {
        const [command] = parseCommandLine(preference.command);
        return command ? `the custom command “${command}”` : "your custom command";
    }
    return "your preferred application";
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
        { command: "zed", args: [] },
        { command: "subl", args: [] },
    ];
}

function terminalCandidates(projectPath: string): Candidate[] {
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
        { command: "gnome-terminal", args: [`--working-directory=${projectPath}`] },
        { command: "konsole", args: ["--workdir", projectPath] },
        { command: "kitty", args: ["--directory", projectPath] },
        { command: "alacritty", args: ["--working-directory", projectPath] },
        { command: "wezterm", args: ["start", "--cwd", projectPath] },
        { command: "xfce4-terminal", args: [`--working-directory=${projectPath}`] },
        { command: "foot", args: [`--working-directory=${projectPath}`] },
        { command: "tilix", args: [`--working-directory=${projectPath}`] },
        { command: "x-terminal-emulator", args: [] },
        { command: "xterm", args: [] },
    ];
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
            const child = spawn(candidate.command, args, { cwd, detached: true, stdio: "ignore", shell: false });
            child.once("error", () => finish(false));
            child.once("spawn", () => finish(true, child));
        } catch {
            finish(false);
        }
    });
}
