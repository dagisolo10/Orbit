import type { OrbitSnapshot, ProjectOpenTarget } from "@/types/project";

export type OrbitErrorCode = "BRIDGE_MISSING" | "SCAN_FAILED" | "OPEN_FAILED";

export type OrbitError = {
    code: OrbitErrorCode;
    message: string;
    detail?: string;
};

export type Result<T> = { ok: true; value: T } | { ok: false; error: OrbitError };

export type BridgeProbe = { channel: string; latencyMs: number };

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
        return { ok: true, value: { projects: result.projects, rootPath: result.rootPath, scannedAt: result.scannedAt } };
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

export async function probeBridge(): Promise<Result<BridgeProbe>> {
    if (!hasPreloadBridge()) {
        return { ok: false, error: { code: "BRIDGE_MISSING", message: "The preload bridge is unavailable." } };
    }

    const started = performance.now();
    try {
        await window.api.invoke("ipc:check");
        return { ok: true, value: { channel: "ipc:check", latencyMs: Math.round(performance.now() - started) } };
    } catch (error) {
        return { ok: false, error: { code: "SCAN_FAILED", message: "The bridge rejected a health check.", detail: toMessage(error) } };
    }
}

function toMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Unknown error";
}
