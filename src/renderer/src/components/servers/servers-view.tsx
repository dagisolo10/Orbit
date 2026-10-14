import { ServerFormModal } from "@/components/servers/server-form-modal";
import { ServerTerminal } from "@/components/servers/server-terminal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { useServers } from "@/contexts/servers-context";
import { useToast } from "@/contexts/toast-context";
import { useProjectActions } from "@/hooks/use-project-actions";
import { copyToClipboard } from "@/lib/clipboard";
import { formatRelativeTime } from "@/lib/format";
import { SERVER_STATUS_META, portFromUrl } from "@/lib/server-status";
import { cn } from "@/lib/utils";
import { openLocalUrl } from "@/services/servers";
import type { ServerLogLine, ServerProject, ServerRuntimeState } from "@shared/types/server";
import { Check, Copy, ExternalLink, FileCode, Play, Plus, RefreshCw, RotateCw, Server, Square, SquarePen, Trash2, TriangleAlert } from "lucide-react";
import { useState } from "react";

function stoppedState(id: string): ServerRuntimeState {
    return { id, status: "stopped", pid: null, startedAt: null, exitCode: null, signal: null, error: null, urls: [] };
}

export function ServersView() {
    const { status, error, projects, states, logs, activeId, activeProject, busyIds, setActiveId, reload, addProject, updateProject, removeProject, start, stop, restart, clearLogs } = useServers();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ServerProject | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<ServerProject | null>(null);

    const openAdd = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (project: ServerProject) => {
        setEditing(project);
        setFormOpen(true);
    };

    if (status === "loading") {
        return (
            <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 border-b border-border px-6 py-2.5">
                    <Skeleton className="h-7 w-28" />
                    <Skeleton className="h-7 w-24" />
                </div>
                <div className="p-6">
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex h-full items-center justify-center p-6">
                <div className="w-full max-w-lg rounded-2xl border border-white/8 bg-white/2 p-6">
                    <div className="flex items-start gap-3">
                        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                            <TriangleAlert className="size-5" strokeWidth={1.8} />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-foreground">{error?.message ?? "Orbit could not load your development servers."}</h3>
                            {error?.detail ? <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{error.detail}</p> : null}
                            <Button variant="secondary" size="sm" className="mt-4" onClick={reload}>
                                <RefreshCw className="size-3.5" />
                                Retry
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const activeState = activeProject ? (states[activeProject.id] ?? stoppedState(activeProject.id)) : null;
    const activeLogs: ServerLogLine[] = activeProject ? (logs[activeProject.id] ?? []) : [];

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-2 border-b border-border px-6 py-2.5">
                <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
                    {projects.map((project) => (
                        <ServerTab
                            key={project.id}
                            project={project}
                            state={states[project.id] ?? stoppedState(project.id)}
                            active={project.id === activeId}
                            onSelect={() => setActiveId(project.id)}
                        />
                    ))}
                </div>
                <Button variant="secondary" size="sm" className="shrink-0" onClick={openAdd}>
                    <Plus className="size-3.5" strokeWidth={2} />
                    Add project
                </Button>
            </div>

            {projects.length === 0 ? (
                <div className="p-6">
                    <EmptyState
                        icon={Server}
                        title="No development servers yet"
                        description="Bring your projects' dev servers into one place. Search your Orbit workspace for a project, set its startup command, and start it without leaving Orbit."
                        action={
                            <Button variant="primary" size="sm" onClick={openAdd}>
                                <Plus className="size-3.5" strokeWidth={2} />
                                Add your first project
                            </Button>
                        }
                    />
                </div>
            ) : activeProject && activeState ? (
                <ServerPanel
                    project={activeProject}
                    state={activeState}
                    logs={activeLogs}
                    busy={busyIds.includes(activeProject.id)}
                    onStart={() => void start(activeProject.id)}
                    onStop={() => void stop(activeProject.id)}
                    onRestart={() => void restart(activeProject.id)}
                    onEdit={() => openEdit(activeProject)}
                    onRemove={() => setConfirmRemove(activeProject)}
                    onClear={() => void clearLogs(activeProject.id)}
                />
            ) : null}

            <ServerFormModal open={formOpen} project={editing} onClose={() => setFormOpen(false)} onSubmit={(draft) => (editing ? updateProject(editing.id, draft) : addProject(draft))} />

            <RemoveProjectModal
                project={confirmRemove}
                onClose={() => setConfirmRemove(null)}
                onConfirm={async () => {
                    if (!confirmRemove) return;
                    const removed = await removeProject(confirmRemove.id);
                    if (removed) setConfirmRemove(null);
                }}
            />
        </div>
    );
}

function ServerTab({ project, state, active, onSelect }: { project: ServerProject; state: ServerRuntimeState; active: boolean; onSelect: () => void }) {
    const meta = SERVER_STATUS_META[state.status];
    const port = state.urls.length > 0 ? portFromUrl(state.urls[0]) : null;

    return (
        <button
            type="button"
            onClick={onSelect}
            title={project.name}
            className={cn(
                "flex max-w-52 shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-white/8 text-foreground" : "text-muted-foreground hover:bg-white/4 hover:text-foreground",
            )}
        >
            <span className={cn("size-1.5 shrink-0 rounded-full", meta.dot)} />
            <span className="truncate">{project.name}</span>
            {port ? <span className="shrink-0 text-[10px] text-muted-foreground/70 tabular-nums">:{port}</span> : null}
        </button>
    );
}

function ServerPanel({
    project,
    state,
    logs,
    busy,
    onStart,
    onStop,
    onRestart,
    onEdit,
    onRemove,
    onClear,
}: {
    project: ServerProject;
    state: ServerRuntimeState;
    logs: ServerLogLine[];
    busy: boolean;
    onStart: () => void;
    onStop: () => void;
    onRestart: () => void;
    onEdit: () => void;
    onRemove: () => void;
    onClear: () => void;
}) {
    const { toast } = useToast();
    const { openPath } = useProjectActions();
    const meta = SERVER_STATUS_META[state.status];
    const [copiedPath, setCopiedPath] = useState(false);

    const isStopped = state.status === "stopped" || state.status === "failed";
    const isUp = state.status === "running" || state.status === "starting";
    const isStopping = state.status === "stopping";

    const openUrl = async (url: string) => {
        const result = await openLocalUrl(url);
        if (!result.ok) toast({ title: result.error.message, description: result.error.detail, tone: "error" });
    };

    const copyPath = () => {
        void copyToClipboard(project.path).then((ok) => {
            if (ok) {
                setCopiedPath(true);
                toast({ title: "Path copied", description: project.path, tone: "success" });
                setTimeout(() => setCopiedPath(false), 1600);
            } else {
                toast({ title: "Could not copy path", description: "Clipboard access was denied.", tone: "error" });
            }
        });
    };

    return (
        <div className="flex min-h-0 flex-1 flex-col p-6">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/8 bg-card">
                <div className="flex flex-wrap items-center gap-3 border-b border-white/6 px-4 py-3">
                    <span className={cn("size-2 shrink-0 rounded-full", meta.dot)} />
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            <span className="truncate">{project.name}</span>
                            <span className={cn("text-[11px] font-medium", meta.text)}>{meta.label}</span>
                        </p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground" title={project.path}>
                            {project.path}
                        </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {isStopped ? (
                            <Button variant="primary" size="sm" onClick={onStart} disabled={busy}>
                                <Play className="size-3.5" strokeWidth={2} />
                                Start
                            </Button>
                        ) : null}
                        {isUp || isStopping ? (
                            <Button variant="secondary" size="sm" onClick={onStop} disabled={busy || isStopping}>
                                <Square className="size-3.5" strokeWidth={2} />
                                Stop
                            </Button>
                        ) : null}
                        {isUp ? (
                            <Button variant="ghost" size="sm" onClick={onRestart} disabled={busy}>
                                <RotateCw className="size-3.5" strokeWidth={2} />
                                Restart
                            </Button>
                        ) : null}
                        <IconButton icon={FileCode} label="Open in editor" size="sm" side="bottom" onClick={() => void openPath(project.path, "editor", project.name)} />
                        <IconButton
                            icon={copiedPath ? Check : Copy}
                            label={copiedPath ? "Path copied" : "Copy path"}
                            size="sm"
                            side="bottom"
                            onClick={copyPath}
                            className={copiedPath ? "text-emerald-400 hover:text-emerald-400" : undefined}
                        />
                        <IconButton icon={SquarePen} label="Edit project" size="sm" side="bottom" onClick={onEdit} />
                        <IconButton icon={Trash2} label="Remove project" size="sm" side="bottom" onClick={onRemove} />
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-white/6 px-4 py-2.5">
                    <span className="font-mono text-[11px] text-muted-foreground">$ {project.command}</span>

                    {state.urls.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {state.urls.map((url) => (
                                <button
                                    key={url}
                                    type="button"
                                    onClick={() => void openUrl(url)}
                                    className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 font-mono text-[11px] text-primary transition-colors hover:bg-primary/20"
                                >
                                    {url}
                                    <ExternalLink className="size-3" strokeWidth={2} />
                                </button>
                            ))}
                        </div>
                    ) : null}

                    <div className="ml-auto flex items-center gap-3 text-[11px] text-muted-foreground/80">
                        {state.pid && state.status === "running" ? <span className="tabular-nums">PID {state.pid}</span> : null}
                        {state.startedAt && state.status === "running" ? <span>Started {formatRelativeTime(state.startedAt)}</span> : null}
                    </div>
                </div>

                {state.error ? (
                    <div className="flex items-start gap-2.5 border-b border-red-400/15 bg-red-400/6 px-4 py-2.5">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-red-300" strokeWidth={1.9} />
                        <p className="text-xs leading-relaxed text-red-200/90">{state.error}</p>
                    </div>
                ) : null}

                <div className="flex items-center justify-between border-b border-white/6 px-4 py-2">
                    <span className="text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">Terminal</span>
                    <button type="button" onClick={onClear} disabled={logs.length === 0} className="text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40">
                        Clear
                    </button>
                </div>

                <ServerTerminal key={project.id} lines={logs} emptyHint={isStopped ? "Start this server to see its output here." : "Waiting for output…"} />
            </div>
        </div>
    );
}

function RemoveProjectModal({ project, onClose, onConfirm }: { project: ServerProject | null; onClose: () => void; onConfirm: () => Promise<void> }) {
    const [removing, setRemoving] = useState(false);

    const confirm = async () => {
        setRemoving(true);
        await onConfirm();
        setRemoving(false);
    };

    return (
        <Modal
            open={project !== null}
            onClose={onClose}
            title="Remove project"
            description={project ? `Remove “${project.name}” from Orbit?` : undefined}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={removing}>
                        Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => void confirm()} disabled={removing}>
                        <Trash2 className="size-3.5" />
                        {removing ? "Removing…" : "Remove"}
                    </Button>
                </>
            }
        >
            <p className="text-[13px] leading-relaxed text-muted-foreground">
                Orbit will stop this server if it is running and remove it from this list. The project folder and its files are left untouched.
            </p>
        </Modal>
    );
}
