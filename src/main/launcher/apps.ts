import type { LaunchAppCatalog, LaunchAppOption, LaunchKind, LaunchPreference, LaunchSource } from "@shared/types/settings";
import { constants } from "fs";
import { access, stat } from "fs/promises";
import { homedir } from "os";
import path from "path";

/**
 * Catalogue and detection for external launchers (editors and terminals).
 *
 * Nothing here assumes an application is installed: every preset lists the
 * command names (and Flatpak/Snap wrapper paths) it might appear under, and
 * availability is decided by resolving those against the filesystem/PATH at
 * request time. Launching always re-resolves so a moved/uninstalled app fails
 * with a clear message rather than a stale cached path.
 */

export type LauncherPreset = {
    id: string;
    label: string;
    kind: LaunchKind;
    /** Candidate executables: bare names (searched on PATH) or absolute paths. */
    commands: string[];
    /** Builds the argv that opens `projectPath`. */
    args: (projectPath: string) => string[];
};

function flatpakWrapper(appId: string): string[] {
    return [path.join("/var/lib/flatpak/exports/bin", appId), path.join(homedir(), ".local/share/flatpak/exports/bin", appId)];
}

const EDITOR_PRESETS: LauncherPreset[] = [
    { id: "vscode", label: "Visual Studio Code", kind: "editor", commands: ["code", "/snap/bin/code", ...flatpakWrapper("com.visualstudio.code")], args: () => [] },
    { id: "vscodium", label: "VSCodium", kind: "editor", commands: ["codium", "/snap/bin/codium", ...flatpakWrapper("com.vscodium.codium")], args: () => [] },
    { id: "cursor", label: "Cursor", kind: "editor", commands: ["cursor"], args: () => [] },
    { id: "windsurf", label: "Windsurf", kind: "editor", commands: ["windsurf"], args: () => [] },
    { id: "zed", label: "Zed", kind: "editor", commands: ["zed"], args: () => [] },
    { id: "sublime", label: "Sublime Text", kind: "editor", commands: ["subl", "/snap/bin/subl"], args: () => [] },
];

const TERMINAL_PRESETS: LauncherPreset[] = [
    { id: "xdg-terminal-exec", label: "System default terminal", kind: "terminal", commands: ["xdg-terminal-exec"], args: () => [] },
    {
        id: "gnome-terminal",
        label: "GNOME Terminal",
        kind: "terminal",
        commands: ["gnome-terminal", ...flatpakWrapper("org.gnome.Terminal")],
        args: (projectPath) => [`--working-directory=${projectPath}`],
    },
    { id: "konsole", label: "Konsole", kind: "terminal", commands: ["konsole", ...flatpakWrapper("org.kde.konsole")], args: (projectPath) => ["--workdir", projectPath] },
    { id: "kitty", label: "Kitty", kind: "terminal", commands: ["kitty"], args: (projectPath) => ["--directory", projectPath] },
    { id: "alacritty", label: "Alacritty", kind: "terminal", commands: ["alacritty"], args: (projectPath) => ["--working-directory", projectPath] },
    { id: "wezterm", label: "WezTerm", kind: "terminal", commands: ["wezterm"], args: (projectPath) => ["start", "--cwd", projectPath] },
    { id: "foot", label: "foot", kind: "terminal", commands: ["foot"], args: (projectPath) => [`--working-directory=${projectPath}`] },
    { id: "tilix", label: "Tilix", kind: "terminal", commands: ["tilix"], args: (projectPath) => [`--working-directory=${projectPath}`] },
    { id: "xfce4-terminal", label: "Xfce Terminal", kind: "terminal", commands: ["xfce4-terminal"], args: (projectPath) => [`--working-directory=${projectPath}`] },
    { id: "xterm", label: "xterm", kind: "terminal", commands: ["xterm"], args: () => [] },
];

const PRESETS = [...EDITOR_PRESETS, ...TERMINAL_PRESETS];

export function findPreset(kind: LaunchKind, id: string): LauncherPreset | undefined {
    return PRESETS.find((preset) => preset.kind === kind && preset.id === id);
}

async function isExecutableFile(target: string): Promise<boolean> {
    try {
        const info = await stat(target);
        if (!info.isFile()) return false;
        if (process.platform === "win32") return true;
        await access(target, constants.X_OK);
        return true;
    } catch {
        return false;
    }
}

/** Resolves a command name to an executable path via PATH (or as an absolute path). */
export async function resolveCommand(command: string): Promise<string | null> {
    const trimmed = command.trim();
    if (trimmed.length === 0) return null;

    if (path.isAbsolute(trimmed) || trimmed.includes(path.sep)) {
        return (await isExecutableFile(trimmed)) ? trimmed : null;
    }

    const searchPath = process.env["PATH"] ?? "";
    const dirs = searchPath.split(path.delimiter).filter(Boolean);
    const extensions = process.platform === "win32" ? (process.env["PATHEXT"] ?? ".EXE;.CMD;.BAT;.COM").split(";") : [""];

    for (const dir of dirs) {
        for (const ext of extensions) {
            const candidate = path.join(dir, trimmed + ext);
            if (await isExecutableFile(candidate)) return candidate;
        }
    }

    return null;
}

function sourceFor(commandPath: string): LaunchSource {
    const normalized = commandPath.split(path.sep).join("/");
    if (normalized.includes("flatpak/exports")) return "flatpak";
    if (normalized.startsWith("/snap/") || normalized.includes("/snap/bin/")) return "snap";
    return "native";
}

/** Returns the first candidate command for a preset that resolves, plus its install source. */
export async function resolvePreset(preset: LauncherPreset): Promise<{ command: string; source: LaunchSource } | null> {
    for (const candidate of preset.commands) {
        const resolved = await resolveCommand(candidate);
        if (resolved) return { command: resolved, source: sourceFor(resolved) };
    }
    return null;
}

async function toOption(preset: LauncherPreset): Promise<LaunchAppOption> {
    const resolved = await resolvePreset(preset);
    return {
        id: preset.id,
        label: preset.label,
        command: resolved?.command ?? preset.commands[0],
        available: resolved !== null,
        source: resolved?.source ?? "native",
    };
}

/** Lists every known launcher with a fresh availability check. */
export async function listLaunchApps(): Promise<LaunchAppCatalog> {
    const [editors, terminals] = await Promise.all([Promise.all(EDITOR_PRESETS.map(toOption)), Promise.all(TERMINAL_PRESETS.map(toOption))]);
    return { editors, terminals };
}

/**
 * Splits a raw command line into argv without invoking a shell. Supports single
 * and double quotes so paths with spaces survive. The result is always spawned
 * with `shell: false`, so nothing here can be interpreted as a shell command.
 */
export function parseCommandLine(input: string): string[] {
    const tokens: string[] = [];
    let current = "";
    let quote: '"' | "'" | null = null;
    let started = false;

    for (const char of input) {
        if (quote) {
            if (char === quote) quote = null;
            else current += char;
        } else if (char === '"' || char === "'") {
            quote = char;
            started = true;
        } else if (/\s/.test(char)) {
            if (started) {
                tokens.push(current);
                current = "";
                started = false;
            }
        } else {
            current += char;
            started = true;
        }
    }

    if (started) tokens.push(current);
    return tokens;
}

export type ResolvedLaunch = { command: string; args: string[]; cwd: string };

/**
 * Resolves a saved preference into a concrete command. Returns `null` for
 * `auto`, signalling the caller to use its built-in probing fallback.
 */
export async function resolvePreference(preference: LaunchPreference, kind: LaunchKind, projectPath: string, cwd: string): Promise<ResolvedLaunch | null> {
    if (preference.mode === "auto") return null;

    if (preference.mode === "preset") {
        const preset = findPreset(kind, preference.id);
        if (!preset) return null;
        const resolved = await resolvePreset(preset);
        if (!resolved) return null;
        return { command: resolved.command, args: preset.args(projectPath), cwd };
    }

    const tokens = parseCommandLine(preference.command);
    if (tokens.length === 0) return null;
    const [command, ...rest] = tokens;
    const resolved = await resolveCommand(command);
    if (!resolved) return null;
    // Editors take the project path as an argument; terminals rely on cwd and
    // any explicit flags the user supplied.
    const args = kind === "editor" ? [...rest, projectPath] : rest;
    return { command: resolved, args, cwd };
}

/** Validates a preference before saving, returning a user-facing message on failure. */
export async function validatePreference(kind: LaunchKind, preference: LaunchPreference): Promise<string | null> {
    if (preference.mode === "auto") return null;

    if (preference.mode === "preset") {
        return findPreset(kind, preference.id) ? null : "That application is not one Orbit can launch.";
    }

    const tokens = parseCommandLine(preference.command);
    if (tokens.length === 0) return "Enter the command Orbit should run.";
    const resolved = await resolveCommand(tokens[0]);
    if (!resolved) return `Orbit could not find “${tokens[0]}”. Enter a command on your PATH or an absolute path to an executable.`;
    return null;
}
