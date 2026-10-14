import { hasPreloadBridge, type OrbitError, type Result } from "@/services/orbit";
import type { ServerEvent, ServerProjectDraft, ServerProjectsResult, ServerRuntimeState, ServerSnapshot } from "@shared/types/server";

/**
 * Renderer-side adapter for the development server manager.
 *
 * Mirrors `services/orbit.ts`: the main process owns every process and
 * filesystem interaction, and this module only shapes invocations and errors
 * for the React layer. Runtime events arrive over a single subscription.
 */

function serverError(message: string, detail?: string): OrbitError {
    return { code: "SERVERS_FAILED", message, detail };
}

function toMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "Unknown error";
}

function missingBridge<T>(): Result<T> {
    return { ok: false, error: serverError("The preload bridge is unavailable.", "Orbit could not reach the main process. Rebuild the app so the preload script is loaded.") };
}

export async function loadServers(): Promise<Result<ServerSnapshot>> {
    if (!hasPreloadBridge()) return missingBridge();

    try {
        const value = await window.api.invoke("servers:list");
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: serverError("Orbit could not load your development servers.", toMessage(error)) };
    }
}

export async function addServer(draft: ServerProjectDraft): Promise<Result<ServerProjectsResult>> {
    if (!hasPreloadBridge()) return missingBridge();

    try {
        const value = await window.api.invoke("servers:add", draft);
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: serverError(toMessage(error)) };
    }
}

export async function updateServer(id: string, draft: ServerProjectDraft): Promise<Result<ServerProjectsResult>> {
    if (!hasPreloadBridge()) return missingBridge();

    try {
        const value = await window.api.invoke("servers:update", id, draft);
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: serverError(toMessage(error)) };
    }
}

export async function removeServer(id: string): Promise<Result<ServerProjectsResult>> {
    if (!hasPreloadBridge()) return missingBridge();

    try {
        const value = await window.api.invoke("servers:remove", id);
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: serverError(toMessage(error)) };
    }
}

export async function startServer(id: string): Promise<Result<ServerRuntimeState>> {
    return runServerAction("servers:start", id, "Orbit could not start that server.");
}

export async function stopServer(id: string): Promise<Result<ServerRuntimeState>> {
    return runServerAction("servers:stop", id, "Orbit could not stop that server.");
}

export async function restartServer(id: string): Promise<Result<ServerRuntimeState>> {
    return runServerAction("servers:restart", id, "Orbit could not restart that server.");
}

async function runServerAction(channel: "servers:start" | "servers:stop" | "servers:restart", id: string, fallback: string): Promise<Result<ServerRuntimeState>> {
    if (!hasPreloadBridge()) return missingBridge();

    try {
        const value = await window.api.invoke(channel, id);
        return { ok: true, value };
    } catch (error) {
        return { ok: false, error: serverError(toMessage(error) || fallback) };
    }
}

export async function clearServerLogs(id: string): Promise<Result<void>> {
    if (!hasPreloadBridge()) return missingBridge();

    try {
        await window.api.invoke("servers:clear-logs", id);
        return { ok: true, value: undefined };
    } catch (error) {
        return { ok: false, error: serverError("Orbit could not clear that terminal.", toMessage(error)) };
    }
}

/** Opens a detected local development URL in the user's browser. */
export async function openLocalUrl(url: string): Promise<Result<void>> {
    if (!hasPreloadBridge()) return missingBridge();

    try {
        await window.api.invoke("system:open-local-url", url);
        return { ok: true, value: undefined };
    } catch (error) {
        return { ok: false, error: serverError("Orbit could not open that URL.", toMessage(error)) };
    }
}

/** Subscribes to server runtime events. Returns a no-op unsubscribe without the bridge. */
export function subscribeServerEvents(listener: (event: ServerEvent) => void): () => void {
    if (typeof window === "undefined" || typeof window.api?.onServerEvent !== "function") {
        return () => undefined;
    }
    return window.api.onServerEvent(listener);
}
