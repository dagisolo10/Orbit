import { ServersContext, type ServerMutationResult, type ServersContextValue, type ServersLoadStatus } from "@/contexts/servers-context";
import { useToast } from "@/contexts/toast-context";
import { addServer, clearServerLogs, loadServers, removeServer, restartServer, startServer, stopServer, subscribeServerEvents, updateServer } from "@/services/servers";
import type { OrbitError } from "@/services/orbit";
import {
    SERVER_LOG_LIMIT,
    type ServerEvent,
    type ServerLogLine,
    type ServerProject,
    type ServerProjectDraft,
    type ServerProjectsResult,
    type ServerRuntimeState,
    type ServerSnapshot,
} from "@shared/types/server";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

const EMPTY_LOGS: ServerLogLine[] = [];

export function ServersProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();

    const [status, setStatus] = useState<ServersLoadStatus>("loading");
    const [error, setError] = useState<OrbitError | null>(null);
    const [projects, setProjects] = useState<ServerProject[]>([]);
    const [states, setStates] = useState<Record<string, ServerRuntimeState>>({});
    const [logs, setLogs] = useState<Record<string, ServerLogLine[]>>({});
    const [activeId, setActiveId] = useState<string | null>(null);
    const [busyIds, setBusyIds] = useState<string[]>([]);

    const markBusy = useCallback((id: string, value: boolean) => {
        setBusyIds((previous) => (value ? (previous.includes(id) ? previous : [...previous, id]) : previous.filter((item) => item !== id)));
    }, []);

    const applySnapshot = useCallback((snapshot: ServerSnapshot) => {
        setProjects(snapshot.projects);
        setStates(Object.fromEntries(snapshot.states.map((state) => [state.id, state])));
        setLogs(snapshot.logs);
    }, []);

    const applyConfig = useCallback((result: ServerProjectsResult) => {
        setProjects(result.projects);
        setStates(Object.fromEntries(result.states.map((state) => [state.id, state])));
        // Keep any output we already have for surviving projects; drop removed ones.
        setLogs((previous) => {
            const next: Record<string, ServerLogLine[]> = {};
            for (const project of result.projects) next[project.id] = previous[project.id] ?? EMPTY_LOGS;
            return next;
        });
    }, []);

    const handleEvent = useCallback((event: ServerEvent) => {
        if (event.type === "state") {
            setStates((previous) => ({ ...previous, [event.state.id]: event.state }));
            return;
        }

        if (event.type === "log") {
            setLogs((previous) => {
                const existing = previous[event.serverId] ?? EMPTY_LOGS;
                const merged = existing.concat(event.lines);
                const trimmed = merged.length > SERVER_LOG_LIMIT ? merged.slice(merged.length - SERVER_LOG_LIMIT) : merged;
                return { ...previous, [event.serverId]: trimmed };
            });
            return;
        }

        // removed
        setStates((previous) => {
            const next = { ...previous };
            delete next[event.serverId];
            return next;
        });
        setLogs((previous) => {
            const next = { ...previous };
            delete next[event.serverId];
            return next;
        });
        setProjects((previous) => previous.filter((project) => project.id !== event.serverId));
    }, []);

    const load = useCallback(async () => {
        setStatus("loading");
        setError(null);
        const result = await loadServers();

        if (result.ok) {
            applySnapshot(result.value);
            setStatus("ready");
            return;
        }

        setError(result.error);
        setStatus("error");
    }, [applySnapshot]);

    useEffect(() => {
        let cancelled = false;
        const unsubscribe = subscribeServerEvents((event) => {
            if (!cancelled) handleEvent(event);
        });

        void load();

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [handleEvent, load]);

    // Keep the selected tab valid as projects are added and removed.
    useEffect(() => {
        setActiveId((previous) => (previous && projects.some((project) => project.id === previous) ? previous : (projects[0]?.id ?? null)));
    }, [projects]);

    const addProject = useCallback(
        async (draft: ServerProjectDraft): Promise<ServerMutationResult> => {
            const result = await addServer(draft);
            if (!result.ok) return { ok: false, message: result.error.message };

            applyConfig(result.value);
            toast({ title: "Project added", description: draft.name, tone: "success" });
            return { ok: true };
        },
        [applyConfig, toast],
    );

    const updateProject = useCallback(
        async (id: string, draft: ServerProjectDraft): Promise<ServerMutationResult> => {
            const result = await updateServer(id, draft);
            if (!result.ok) return { ok: false, message: result.error.message };

            applyConfig(result.value);
            toast({ title: "Project updated", description: draft.name, tone: "success" });
            return { ok: true };
        },
        [applyConfig, toast],
    );

    const removeProject = useCallback(
        async (id: string): Promise<boolean> => {
            const result = await removeServer(id);
            if (!result.ok) {
                toast({ title: result.error.message, description: result.error.detail, tone: "error" });
                return false;
            }

            applyConfig(result.value);
            toast({ title: "Project removed", tone: "success" });
            return true;
        },
        [applyConfig, toast],
    );

    const runAction = useCallback(
        async (id: string, action: "start" | "stop" | "restart") => {
            markBusy(id, true);
            const result = action === "start" ? await startServer(id) : action === "stop" ? await stopServer(id) : await restartServer(id);
            markBusy(id, false);

            if (result.ok) {
                setStates((previous) => ({ ...previous, [id]: result.value }));
                return;
            }

            toast({ title: result.error.message, description: result.error.detail, tone: "error" });
        },
        [markBusy, toast],
    );

    const start = useCallback((id: string) => runAction(id, "start"), [runAction]);
    const stop = useCallback((id: string) => runAction(id, "stop"), [runAction]);
    const restart = useCallback((id: string) => runAction(id, "restart"), [runAction]);

    const clearLogs = useCallback(
        async (id: string) => {
            const result = await clearServerLogs(id);
            if (result.ok) {
                setLogs((previous) => ({ ...previous, [id]: [] }));
                return;
            }
            toast({ title: result.error.message, description: result.error.detail, tone: "error" });
        },
        [toast],
    );

    const activeProject = useMemo(() => projects.find((project) => project.id === activeId) ?? null, [projects, activeId]);

    const value = useMemo<ServersContextValue>(
        () => ({
            status,
            error,
            projects,
            states,
            logs,
            activeId,
            activeProject,
            busyIds,
            setActiveId,
            reload: () => void load(),
            addProject,
            updateProject,
            removeProject,
            start,
            stop,
            restart,
            clearLogs,
        }),
        [status, error, projects, states, logs, activeId, activeProject, busyIds, load, addProject, updateProject, removeProject, start, stop, restart, clearLogs],
    );

    return <ServersContext.Provider value={value}>{children}</ServersContext.Provider>;
}
