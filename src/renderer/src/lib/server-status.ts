import type { ServerStatus } from "@shared/types/server";

/**
 * Presentation metadata for each server status: a short label, the colour of
 * the status dot, and the colour used for the status text.
 */
export const SERVER_STATUS_META: Record<ServerStatus, { label: string; dot: string; text: string }> = {
    starting: { label: "Starting", dot: "bg-amber-400 animate-pulse", text: "text-amber-300" },
    running: { label: "Running", dot: "bg-emerald-400", text: "text-emerald-300" },
    stopping: { label: "Stopping", dot: "bg-amber-400 animate-pulse", text: "text-amber-300" },
    stopped: { label: "Stopped", dot: "bg-white/30", text: "text-muted-foreground" },
    failed: { label: "Failed", dot: "bg-red-400", text: "text-red-300" },
};

/** Extracts the port from a detected URL, for compact display on tabs. */
export function portFromUrl(url: string): string | null {
    try {
        const parsed = new URL(url);
        return parsed.port || (parsed.protocol === "https:" ? "443" : "80");
    } catch {
        return null;
    }
}
