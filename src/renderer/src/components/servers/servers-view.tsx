import { ServerFormModal } from "@/components/servers/server-form-modal";
import { ServerTerminal } from "@/components/servers/server-terminal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { IconButton } from "@/components/ui/icon-button";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { useServers } from "@/contexts/servers-context";
import { useToast } from "@/contexts/toast-context";
import { useDrag, type DragHandlers } from "@/hooks/use-drag";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useProjectActions } from "@/hooks/use-project-actions";
import { copyToClipboard } from "@/lib/clipboard";
import { formatRelativeTime, shortenPath } from "@/lib/format";
import { SERVER_STATUS_META, portFromUrl } from "@/lib/server-status";
import { cn } from "@/lib/utils";
import { openLocalUrl } from "@/services/servers";
import { VIEW_META } from "@/types/navigation";
import type { ServerLogLine, ServerProject, ServerRuntimeState } from "@shared/types/server";
import { Check, Columns3, Copy, ExternalLink, FileCode, GripVertical, Play, Plus, RefreshCw, RotateCw, Rows3, Server, Square, SquarePen, Trash2, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

type ServerLayout = "column" | "row";

function stoppedState(id: string): ServerRuntimeState {
    return { id, status: "stopped", pid: null, startedAt: null, exitCode: null, signal: null, error: null, urls: [] };
}

export function ServersView() {
    const { status, error, projects, states, logs, activeId, activeProject, busyIds, setActiveId, reload, addProject, updateProject, removeProject, reorder, start, stop, restart, clearLogs } =
        useServers();

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<ServerProject | null>(null);
    const [confirmRemove, setConfirmRemove] = useState<ServerProject | null>(null);
    const [layout, setLayout] = useLocalStorage<ServerLayout>("orbit.serversLayout", "column");
    const serverIds = useMemo(() => projects.map((project) => project.id), [projects]);
    const { dragId, dragOverId, getDragHandlers } = useDrag({ items: serverIds, onReorder: (ids) => void reorder(ids) });

    const openAdd = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (project: ServerProject) => {
        setEditing(project);
        setFormOpen(true);
    };

    const header = (
        <ServersHeader
            layout={layout}
            onAdd={openAdd}
            onReload={reload}
            onLayoutChange={setLayout}
            projectCount={projects.length}
            runningCount={Object.values(states).filter((state) => state.status === "running" || state.status === "starting").length}
        />
    );

    if (status === "loading") {
        return (
            <div className="flex h-full min-h-0 flex-col">
                {header}
                {layout === "column" ? (
                    <div className="flex min-h-0 flex-1">
                        <div className="hidden w-70 shrink-0 space-y-2 border-r border-line p-3 lg:block">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <Skeleton key={index} className="h-11 w-full" />
                            ))}
                        </div>
                        <div className="flex-1 p-4">
                            <Skeleton className="h-full min-h-64 w-full" />
                        </div>
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <div className="flex shrink-0 gap-2 overflow-hidden border-b border-line p-3">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <Skeleton key={index} className="h-13 w-48 shrink-0" />
                            ))}
                        </div>
                        <div className="flex-1 p-4">
                            <Skeleton className="h-full min-h-64 w-full" />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (status === "error") {
        return (
            <div className="flex h-full min-h-0 flex-col">
                {header}
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-5 lg:p-8">
                    <div className="w-full max-w-xl">
                        <EmptyState
                            icon={TriangleAlert}
                            label="SERVERS OFFLINE"
                            title={error?.message ?? "Orbit could not load your development servers."}
                            description={error?.detail ?? "The main process did not return a server configuration."}
                            action={
                                <Button variant="secondary" size="sm" onClick={reload}>
                                    <RefreshCw className="size-3.5" />
                                    Retry
                                </Button>
                            }
                        />
                    </div>
                </div>
            </div>
        );
    }

    const activeState = activeProject ? (states[activeProject.id] ?? stoppedState(activeProject.id)) : null;
    const activeLogs: ServerLogLine[] = activeProject ? (logs[activeProject.id] ?? []) : [];

    return (
        <div className="flex h-full min-h-0 flex-col">
            {header}

            {projects.length === 0 ? (
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-5 lg:p-8">
                    <div className="w-full max-w-2xl">
                        <EmptyState
                            icon={Server}
                            label="NO SERVERS"
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
                </div>
            ) : (
                <div className={cn("flex min-h-0 flex-1", layout === "column" ? "flex-col lg:flex-row" : "flex-col")}>
                    {layout === "column" ? (
                        <aside className="flex max-h-52 min-h-0 w-full shrink-0 flex-col border-b border-line bg-panel lg:max-h-none lg:w-71.5 lg:border-r lg:border-b-0">
                            <ServerIndexHeader count={projects.length} />
                            <div className="min-h-0 flex-1 overflow-y-auto">
                                {projects.map((project, index) => (
                                    <ServerIndexRow
                                        index={index}
                                        layout="column"
                                        key={project.id}
                                        project={project}
                                        active={project.id === activeId}
                                        dragging={project.id === dragId}
                                        dragOver={project.id === dragOverId}
                                        onSelect={() => setActiveId(project.id)}
                                        dragHandlers={getDragHandlers(project.id)}
                                        state={states[project.id] ?? stoppedState(project.id)}
                                    />
                                ))}
                            </div>
                            <div className="hidden shrink-0 border-t border-line px-3 py-2 font-mono text-[9px] leading-relaxed tracking-[0.04em] text-ink-muted/70 lg:block">
                                Drag rows to reorder the index.
                            </div>
                        </aside>
                    ) : (
                        <div className="flex shrink-0 flex-col border-b border-line bg-panel">
                            <ServerIndexHeader count={projects.length} />
                            <div className="flex gap-1.5 overflow-x-auto p-2">
                                {projects.map((project, index) => (
                                    <ServerIndexRow
                                        layout="row"
                                        index={index}
                                        key={project.id}
                                        project={project}
                                        active={project.id === activeId}
                                        dragging={project.id === dragId}
                                        dragOver={project.id === dragOverId}
                                        onSelect={() => setActiveId(project.id)}
                                        dragHandlers={getDragHandlers(project.id)}
                                        state={states[project.id] ?? stoppedState(project.id)}
                                    />
                                ))}
                            </div>
                            <div className="hidden shrink-0 border-t border-line px-3 py-1.5 font-mono text-[9px] leading-relaxed tracking-[0.04em] text-ink-muted/70 lg:block">
                                Drag cards to reorder the index.
                            </div>
                        </div>
                    )}

                    <section className="flex min-h-0 min-w-0 flex-1 flex-col">
                        {activeProject && activeState ? (
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
                        ) : (
                            <div className="flex min-h-0 flex-1 items-center justify-center p-5">
                                <EmptyState icon={Server} label="NO SELECTION" title="Select a server" description="Choose a project from the server index to inspect its runtime and output." />
                            </div>
                        )}
                    </section>
                </div>
            )}

            <ServerFormModal
                open={formOpen}
                project={editing}
                onClose={() => setFormOpen(false)}
                key={`${editing?.path}-${formOpen}`}
                onSubmit={(draft) => (editing ? updateProject(editing.id, draft) : addProject(draft))}
            />

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

function ServersHeader({
    onAdd,
    layout,
    onReload,
    projectCount,
    runningCount,
    onLayoutChange,
}: {
    onAdd: () => void;
    onReload: () => void;
    projectCount: number;
    runningCount: number;
    layout: ServerLayout;
    onLayoutChange: (layout: ServerLayout) => void;
}) {
    const meta = VIEW_META.servers;

    return (
        <div className="shrink-0 border-b border-line px-5 py-4 lg:px-8">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="label-mono text-ink-muted">
                            <span className="text-accent">●</span> ORBIT / {meta.section}
                        </span>
                        <span className="rounded-[1px] border border-line px-1 py-px font-mono text-[9px] tracking-[0.14em] text-ink-muted">{meta.index}</span>
                    </div>
                    <h1 className="mt-1.5 text-[22px] leading-tight font-semibold tracking-[-0.02em] text-ink">{meta.title}</h1>
                    <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-ink-soft">{meta.subtitle}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex h-7 items-center gap-2 rounded-[2px] border border-line bg-panel px-2 font-mono text-[9px] tracking-[0.08em] text-ink-muted uppercase">
                        ACTIVE
                        <span className={cn("tabular-nums", runningCount > 0 ? "text-ok" : "text-ink-soft")}>
                            {String(runningCount).padStart(2, "0")}/{String(projectCount).padStart(2, "0")}
                        </span>
                    </span>
                    <Segmented<ServerLayout>
                        options={[
                            { value: "column", label: "Column", icon: Columns3 },
                            { value: "row", label: "Row", icon: Rows3 },
                        ]}
                        value={layout}
                        onChange={onLayoutChange}
                    />
                    <IconButton icon={RefreshCw} label="Reload servers" size="sm" side="bottom" onClick={onReload} />
                    <Button variant="primary" size="sm" onClick={onAdd}>
                        <Plus className="size-3.5" strokeWidth={2} />
                        Add project
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ServerIndexHeader({ count }: { count: number }) {
    return (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-3 py-2">
            <span className="label-mono text-ink-muted">SERVER INDEX</span>
            <span className="font-mono text-[9px] tabular-nums text-ink-muted/70">{String(count).padStart(2, "0")}</span>
        </div>
    );
}

function ServerIndexRow({
    project,
    index,
    state,
    active,
    dragging,
    dragOver,
    layout,
    onSelect,
    dragHandlers,
}: {
    project: ServerProject;
    index: number;
    state: ServerRuntimeState;
    active: boolean;
    dragging: boolean;
    dragOver: boolean;
    layout: ServerLayout;
    onSelect: () => void;
    dragHandlers: DragHandlers;
}) {
    const meta = SERVER_STATUS_META[state.status];
    const port = state.urls.length > 0 ? portFromUrl(state.urls[0]) : null;
    const isRow = layout === "row";

    return (
        <button
            {...dragHandlers}
            type="button"
            onClick={onSelect}
            title={project.name}
            aria-current={active ? "true" : undefined}
            className={cn(
                "group flex items-center gap-2 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset",
                isRow ? "w-52 shrink-0 rounded-[2px] border border-line bg-panel-inset px-2.5 py-2" : "w-full border-b border-line-soft px-3 py-2.5",
                active
                    ? isRow
                        ? "border-accent/40 bg-panel-raised shadow-[inset_0_-2px_0_0_var(--accent)]"
                        : "bg-panel-raised shadow-[inset_2px_0_0_0_var(--accent)]"
                    : isRow
                      ? "hover:border-line hover:bg-panel"
                      : "hover:bg-white/2",
                dragging && "opacity-40",
                dragOver && !dragging && "bg-accent/6",
            )}
        >
            <GripVertical className="size-3 shrink-0 cursor-grab text-ink-muted/40 group-hover:text-ink-muted" strokeWidth={1.8} />
            <span aria-hidden className={cn("size-1.5 shrink-0 rounded-[1px]", meta.dot)} />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-ink">{project.name}</span>
                <span className="block truncate font-mono text-[9px] text-ink-muted" title={project.path}>
                    {port ? `localhost:${port}` : meta.label.toLowerCase()}
                </span>
            </span>
            <span className="shrink-0 font-mono text-[9px] tabular-nums text-ink-muted/50">{String(index + 1).padStart(2, "0")}</span>
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
        <div className="flex min-h-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-line bg-panel px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-2">
                            <span aria-hidden className={cn("size-2 shrink-0 rounded-[1px]", meta.dot)} />
                            <h2 className="truncate text-[14px] font-semibold tracking-tight text-ink">{project.name}</h2>
                            <span className={cn("shrink-0 font-mono text-[9px] tracking-[0.12em] uppercase", meta.text)}>{meta.label}</span>
                        </div>
                        <p className="mt-1 truncate font-mono text-[9.5px] text-ink-muted" title={project.path}>
                            {shortenPath(project.path, 64)}
                        </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-1.5">
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
                        <span aria-hidden className="mx-1 hidden h-5 w-px bg-line sm:block" />
                        <IconButton icon={FileCode} label="Open in editor" size="sm" side="bottom" onClick={() => void openPath(project.path, "editor", project.name)} />
                        <IconButton
                            icon={copiedPath ? Check : Copy}
                            label={copiedPath ? "Path copied" : "Copy path"}
                            size="sm"
                            side="bottom"
                            onClick={copyPath}
                            className={copiedPath ? "text-ok hover:text-ok" : undefined}
                        />
                        <IconButton icon={SquarePen} label="Edit project" size="sm" side="bottom" onClick={onEdit} />
                        <IconButton icon={Trash2} label="Remove project" size="sm" side="bottom" onClick={onRemove} />
                    </div>
                </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-panel-inset px-4 py-2">
                <span className="min-w-0 truncate font-mono text-[10px] text-ink-soft" title={project.command}>
                    <span className="text-ink-muted/60">$</span> {project.command}
                </span>

                {state.urls.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                        {state.urls.map((url) => (
                            <button
                                key={url}
                                type="button"
                                onClick={() => void openUrl(url)}
                                className="inline-flex items-center gap-1.5 rounded-[1px] border border-accent/30 bg-accent/8 px-2 py-0.5 font-mono text-[10px] text-accent outline-none transition-colors hover:border-accent/60 hover:bg-accent/[0.14] focus-visible:ring-1 focus-visible:ring-accent"
                            >
                                {url}
                                <ExternalLink className="size-2.5" strokeWidth={2} />
                            </button>
                        ))}
                    </div>
                ) : null}

                <div className="ml-auto flex shrink-0 items-center gap-3 font-mono text-[9px] tracking-[0.06em] text-ink-muted uppercase">
                    {state.pid && state.status === "running" ? <span className="tabular-nums">PID {state.pid}</span> : null}
                    {state.startedAt && state.status === "running" ? <span>Started {formatRelativeTime(state.startedAt)}</span> : null}
                </div>
            </div>

            {state.error ? (
                <div className="flex shrink-0 items-start gap-2.5 border-b border-danger/25 bg-danger/6 px-4 py-2.5">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" strokeWidth={1.9} />
                    <p className="text-[11px] leading-relaxed text-danger/90">{state.error}</p>
                </div>
            ) : null}

            <div className="flex shrink-0 items-center justify-between border-b border-line bg-panel px-4 py-1.5">
                <span className="flex items-center gap-2 font-mono text-[9px] tracking-[0.12em] text-ink-muted uppercase">
                    OUTPUT
                    <span className="tabular-nums text-ink-muted/60">{String(logs.length).padStart(3, "0")}</span>
                </span>
                <button
                    type="button"
                    onClick={onClear}
                    disabled={logs.length === 0}
                    className="font-mono text-[9px] tracking-[0.08em] text-ink-muted uppercase outline-none transition-colors hover:text-ink focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40"
                >
                    Clear
                </button>
            </div>

            <ServerTerminal key={project.id} lines={logs} emptyHint={isStopped ? "Start this server to see its output here." : "Waiting for output…"} />
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
            <div className="flex items-start gap-2.5 border border-danger/25 bg-danger/6 px-3 py-2.5">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" strokeWidth={1.9} />
                <p className="text-[12px] leading-relaxed text-ink-soft">
                    Orbit will stop this server if it is running and remove it from this list. The project folder and its files are left untouched.
                </p>
            </div>
        </Modal>
    );
}
