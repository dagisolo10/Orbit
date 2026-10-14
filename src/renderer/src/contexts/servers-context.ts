import type { OrbitError } from "@/services/orbit";
import type { ServerLogLine, ServerProject, ServerProjectDraft, ServerRuntimeState } from "@shared/types/server";
import { createContext, useContext } from "react";

export type ServersLoadStatus = "loading" | "ready" | "error";

/** Result of a config mutation, so forms can show validation errors inline. */
export type ServerMutationResult = { ok: true } | { ok: false; message: string };

export type ServersContextValue = {
    status: ServersLoadStatus;
    error: OrbitError | null;
    projects: ServerProject[];
    states: Record<string, ServerRuntimeState>;
    logs: Record<string, ServerLogLine[]>;
    /** The project currently shown in the tab panel. */
    activeId: string | null;
    activeProject: ServerProject | null;
    /** Ids with an in-flight start/stop/restart, used to disable controls. */
    busyIds: string[];
    setActiveId: (id: string | null) => void;
    reload: () => void;
    addProject: (draft: ServerProjectDraft) => Promise<ServerMutationResult>;
    updateProject: (id: string, draft: ServerProjectDraft) => Promise<ServerMutationResult>;
    removeProject: (id: string) => Promise<boolean>;
    start: (id: string) => Promise<void>;
    stop: (id: string) => Promise<void>;
    restart: (id: string) => Promise<void>;
    clearLogs: (id: string) => Promise<void>;
};

export const ServersContext = createContext<ServersContextValue | null>(null);

export function useServers(): ServersContextValue {
    const context = useContext(ServersContext);
    if (!context) throw new Error("useServers must be used inside a <ServersProvider>.");
    return context;
}
