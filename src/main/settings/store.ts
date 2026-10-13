import type { LaunchPreference, LaunchPreferences, ProjectsRootState } from "@shared/types/settings";
import { app } from "electron";
import { constants } from "fs";
import { access, mkdir, readFile, stat, writeFile } from "fs/promises";
import path from "path";

/**
 * Tiny JSON settings store for the main process.
 *
 * Settings live in `<userData>/settings.json` and are resolved on demand so the
 * renderer never has to pass them back in. A plain JSON document is enough at
 * this size; a larger store can replace it once one is warranted.
 *
 * Every write merges into the full document so updating one setting never
 * clobbers the others.
 */

export type AppSettings = {
    projectsRoot: string | null;
    editor: LaunchPreference;
    terminal: LaunchPreference;
};

export type SettingsErrorCode = "INVALID_ROOT" | "INVALID_PREFERENCE";

export class SettingsError extends Error {
    readonly code: SettingsErrorCode;

    constructor(message: string, code: SettingsErrorCode = "INVALID_ROOT") {
        super(message);
        this.name = "SettingsError";
        this.code = code;
    }
}

const SETTINGS_FILE = "settings.json";

function settingsFilePath(): string {
    return path.join(app.getPath("userData"), SETTINGS_FILE);
}

/** The fallback root, preserving Orbit's original `<home>/Projects` behavior. */
export function defaultProjectsRoot(): string {
    return path.join(app.getPath("home"), "Projects");
}

function parsePreference(value: unknown): LaunchPreference {
    if (value && typeof value === "object") {
        const candidate = value as { mode?: unknown; id?: unknown; command?: unknown };
        if (candidate.mode === "preset" && typeof candidate.id === "string" && candidate.id.trim().length > 0) {
            return { mode: "preset", id: candidate.id };
        }
        if (candidate.mode === "custom" && typeof candidate.command === "string" && candidate.command.trim().length > 0) {
            return { mode: "custom", command: candidate.command.trim() };
        }
    }
    return { mode: "auto" };
}

async function readSettings(): Promise<AppSettings> {
    try {
        const raw = await readFile(settingsFilePath(), "utf-8");
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        const projectsRoot = typeof parsed.projectsRoot === "string" && parsed.projectsRoot.trim().length > 0 ? parsed.projectsRoot : null;
        return { projectsRoot, editor: parsePreference(parsed.editor), terminal: parsePreference(parsed.terminal) };
    } catch {
        return { projectsRoot: null, editor: { mode: "auto" }, terminal: { mode: "auto" } };
    }
}

async function writeSettings(settings: AppSettings): Promise<void> {
    const filePath = settingsFilePath();
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${JSON.stringify(settings, null, 4)}\n`, "utf-8");
}

async function isReadableDirectory(target: string): Promise<boolean> {
    try {
        const info = await stat(target);
        if (!info.isDirectory()) return false;
        await access(target, constants.R_OK);
        return true;
    } catch {
        return false;
    }
}

/** Resolves the saved root (or the `<home>/Projects` default) with availability info. */
export async function getProjectsRootState(): Promise<ProjectsRootState> {
    const settings = await readSettings();
    const defaultPath = defaultProjectsRoot();
    const effective = settings.projectsRoot ?? defaultPath;

    return {
        path: effective,
        isCustom: settings.projectsRoot !== null,
        available: await isReadableDirectory(effective),
        defaultPath,
    };
}

/** Validates and persists a user-selected projects root, then returns the new state. */
export async function setProjectsRoot(rootPath: string): Promise<ProjectsRootState> {
    if (typeof rootPath !== "string" || rootPath.trim().length === 0 || !path.isAbsolute(rootPath)) {
        throw new SettingsError("Please choose a folder to use as your projects directory.");
    }

    const normalized = path.normalize(rootPath);

    if (!(await isReadableDirectory(normalized))) {
        throw new SettingsError("That folder does not exist or cannot be read. Choose another folder.");
    }

    const settings = await readSettings();
    await writeSettings({ ...settings, projectsRoot: normalized });
    return getProjectsRootState();
}

/** The absolute path the scanner should read, honoring any saved selection. */
export async function resolveProjectsRoot(): Promise<string> {
    const settings = await readSettings();
    return settings.projectsRoot ?? defaultProjectsRoot();
}

/** The saved editor/terminal choices, used to resolve launch actions. */
export async function getLaunchPreferences(): Promise<LaunchPreferences> {
    const settings = await readSettings();
    return { editor: settings.editor, terminal: settings.terminal };
}

/**
 * Persists a single launcher preference. The caller is responsible for
 * validating the value against the launcher catalog before saving.
 */
export async function setLaunchPreference(kind: keyof LaunchPreferences, preference: LaunchPreference): Promise<LaunchPreferences> {
    const settings = await readSettings();
    const next: AppSettings = {
        ...settings,
        editor: kind === "editor" ? preference : settings.editor,
        terminal: kind === "terminal" ? preference : settings.terminal,
    };
    await writeSettings(next);
    return { editor: next.editor, terminal: next.terminal };
}
