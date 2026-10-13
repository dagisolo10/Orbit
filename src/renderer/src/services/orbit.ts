import type { OrbitSnapshot, ProjectOpenTarget } from "@/types/project";
import type { AppInfo, LaunchAppCatalog, LaunchKind, LaunchPreference, LaunchPreferences, ProjectsRootState } from "@shared/types/settings";

export type OrbitErrorCode = "BRIDGE_MISSING" | "SCAN_FAILED" | "OPEN_FAILED" | "SETTINGS_FAILED" | "PICK_FAILED" | "LAUNCHER_FAILED" | "APP_INFO_FAILED" | "EXTERNAL_FAILED";

export type OrbitError = {
    code: OrbitErrorCode;
    message: string;
    detail?: string;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: OrbitError };

/**
 * Renderer-side adapter for the main-process scanner.
 *
 * All filesystem access lives in the main process. The preload script exposes a
 * single, narrow `window.api.scanProjects()` method backed by the typed
 * `projects:scan` IPC channel; this module only shapes results and errors for
 * the React layer.
 */
export function hasPreloadBridge(): boolean {
    return typeof window !== "undefined" && typeof window.api.invoke === "function";
}

async function runScan(): Promise<Result<OrbitSnapshot>> {
    if (!hasPreloadBridge()) {
        return {
            ok: false,
            error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable.", detail: "Orbit could not reach the main process. Rebuild the app so the preload script is loaded." },
        };
    }

    try {
        const result = await window.api.invoke("projects:scan");
        return { ok: true, value: { projects: result.projects, workspaces: result.workspaces, rootPath: result.rootPath, scannedAt: result.scannedAt } };
    } catch (error) {
        return { ok: false, error: { code: "SCAN_FAILED", message: "Orbit could not scan your projects.", detail: toMessage(error) } };
    }
}

export function loadProjects(): Promise<Result<OrbitSnapshot>> {
    return runScan();
}

export function reScanProjects(): Promise<Result<OrbitSnapshot>> {
    return runScan();
}

export async function openProject(projectPath: string, target: ProjectOpenTarget): Promise<Result<void>> {
    try {
        await window.api.invoke("project:open", projectPath, target);
        return { ok: true, value: undefined };
    } catch (error) {
        return { ok: false, error: { code: "OPEN_FAILED", message: openFailureMessage(target), detail: toMessage(error) } };
    }
}

/** Reads the persisted projects root and whether it is currently usable. */
export async function loadProjectsRoot(): Promise<Result<ProjectsRootState>> {
    if (!hasPreloadBridge()) {
        return { ok: false, error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable." } };
    }

    try {
        const value = await window.api.invoke("settings:get-projects-root");
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: { code: "SETTINGS_FAILED", message: "Orbit could not read the projects directory setting.", detail: toMessage(error) } };
    }
}

/** Persists a user-selected projects root. The main process validates it first. */
export async function saveProjectsRoot(rootPath: string): Promise<Result<ProjectsRootState>> {
    if (!hasPreloadBridge()) {
        return { ok: false, error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable." } };
    }

    try {
        const value = await window.api.invoke("settings:set-projects-root", rootPath);
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: { code: "SETTINGS_FAILED", message: toMessage(error) } };
    }
}

/** Opens the native directory picker. Resolves to `null` when the user cancels. */
export async function pickDirectory(defaultPath?: string): Promise<Result<string | null>> {
    if (!hasPreloadBridge()) {
        return { ok: false, error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable." } };
    }

    try {
        const value = await window.api.invoke("dialog:pick-directory", defaultPath);
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: { code: "PICK_FAILED", message: "Orbit could not open the folder picker.", detail: toMessage(error) } };
    }
}

/** Lists every known editor/terminal with a fresh availability check. */
export async function loadLaunchApps(): Promise<Result<LaunchAppCatalog>> {
    if (!hasPreloadBridge()) {
        return { ok: false, error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable." } };
    }

    try {
        const value = await window.api.invoke("launcher:list");
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: { code: "LAUNCHER_FAILED", message: "Orbit could not detect installed applications.", detail: toMessage(error) } };
    }
}

/** Reads the persisted editor and terminal preferences. */
export async function loadLaunchPreferences(): Promise<Result<LaunchPreferences>> {
    if (!hasPreloadBridge()) {
        return { ok: false, error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable." } };
    }

    try {
        const value = await window.api.invoke("settings:get-launch-preferences");
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: { code: "LAUNCHER_FAILED", message: "Orbit could not read your application preferences.", detail: toMessage(error) } };
    }
}

/** Persists one launcher preference. The main process validates it first. */
export async function saveLaunchPreference(kind: LaunchKind, preference: LaunchPreference): Promise<Result<LaunchPreferences>> {
    if (!hasPreloadBridge()) {
        return { ok: false, error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable." } };
    }

    try {
        const value = await window.api.invoke("settings:set-launch-preference", kind, preference);
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: { code: "LAUNCHER_FAILED", message: toMessage(error) } };
    }
}

/** Reads the app name and installed version for the About section. */
export async function loadAppInfo(): Promise<Result<AppInfo>> {
    if (!hasPreloadBridge()) {
        return { ok: false, error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable." } };
    }

    try {
        const value = await window.api.invoke("app:get-info");
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: { code: "APP_INFO_FAILED", message: "Orbit could not read its version.", detail: toMessage(error) } };
    }
}

/** Opens an allowlisted https link (docs, repository) in the default browser. */
export async function openExternal(url: string): Promise<Result<void>> {
    if (!hasPreloadBridge()) {
        return { ok: false, error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable." } };
    }

    try {
        await window.api.invoke("system:open-external", url);
        return { ok: true, value: undefined };
    } catch (error) {
        return { ok: false, error: { code: "EXTERNAL_FAILED", message: "Orbit could not open that link.", detail: toMessage(error) } };
    }
}

function openFailureMessage(target: ProjectOpenTarget): string {
    switch (target) {
        case "editor":
            return "Orbit could not open this project in an editor.";
        case "terminal":
            return "Orbit could not open a terminal for this project.";
        case "file-manager":
            return "Orbit could not reveal this project in the file manager.";
        default:
            return "Orbit could not open this project.";
    }
}

function toMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Unknown error";
}
