/**
 * Types for the Local Development Server Manager.
 *
 * Project configuration is persisted as JSON and shared verbatim between the
 * main process, the preload bridge, and the renderer. Runtime state (status,
 * pid, urls) and terminal output are owned by the main process and streamed to
 * the renderer; process handles themselves never cross the IPC boundary.
 */

/** A configured development server. This is the persisted shape. */
export type ServerProject = {
    id: string;
    name: string;
    /** Absolute path to the directory the command runs in. */
    path: string;
    /** The command line to run, e.g. `npm run dev`. Tokenized without a shell. */
    command: string;
    createdAt: number;
};

/** The user-editable fields when adding or editing a project. */
export type ServerProjectDraft = {
    name: string;
    path: string;
    command: string;
};

export type ServerStatus = "starting" | "running" | "stopping" | "stopped" | "failed";

/** Live, non-persisted state for one configured server. */
export type ServerRuntimeState = {
    id: string;
    status: ServerStatus;
    pid: number | null;
    startedAt: number | null;
    exitCode: number | null;
    signal: string | null;
    /** A user-facing error when the server failed to start or exited unexpectedly. */
    error: string | null;
    /** Localhost URLs detected in the server's output, de-duplicated. */
    urls: string[];
};

export type ServerLogStream = "stdout" | "stderr" | "system";

/** Maximum number of recent log lines retained per server (main and renderer). */
export const SERVER_LOG_LIMIT = 4000;

export type ServerLogLine = {
    /** Monotonically increasing per server, used for stable React keys. */
    seq: number;
    stream: ServerLogStream;
    text: string;
    at: number;
};

/** The configuration and runtime state every renderer needs to render the view. */
export type ServerSnapshot = {
    projects: ServerProject[];
    states: ServerRuntimeState[];
    /** Recent terminal output per project id. */
    logs: Record<string, ServerLogLine[]>;
};

/** The configuration and runtime state returned by config mutations. */
export type ServerProjectsResult = {
    projects: ServerProject[];
    states: ServerRuntimeState[];
};

/**
 * The single channel the main process pushes runtime state and log lines on.
 * Keeping it to one channel means the preload only exposes one subscription.
 */
export const SERVER_EVENT_CHANNEL = "servers:event";

/** Events pushed from the main process to the renderer over a single channel. */
export type ServerEvent = { type: "state"; state: ServerRuntimeState } | { type: "log"; serverId: string; lines: ServerLogLine[] } | { type: "removed"; serverId: string };
