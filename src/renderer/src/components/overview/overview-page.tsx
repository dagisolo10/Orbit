import { ChangeFolderButton } from "@/components/common/change-folder-button";
import { ScanErrorBanner, ScannerOfflineState } from "@/components/common/scanner-offline-state";
import { ProjectDetails } from "@/components/projects/project-detail";
import { Button } from "@/components/ui/button";
import { DataBar } from "@/components/ui/data-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { Monogram } from "@/components/ui/monogram";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { TechBadge } from "@/components/ui/tech-badge";
import { TechIcon } from "@/components/ui/tech-icon";
import { useOrbit, type TechnologyStat } from "@/contexts/orbit-context";
import { formatRelativeTime, getBaseName, pluralize, shortenPath } from "@/lib/format";
import { getCategoryMeta, getTechLabel } from "@/lib/tech";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/types/navigation";
import type { Project, Technology, Workspace } from "@/types/project";
import { ArrowUpRight, Boxes, ChevronRight, FolderOpen, FolderSearch, RefreshCw, Star } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

const FEATURED_LIMIT = 6;
const PINNED_LIMIT = 5;

export function OverviewPage({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    const { status, error, reload, reScan, reScanning, dismissError, allProjects, workspaces, technologies, favorites, snapshot, setActiveTech, projectsRoot } = useOrbit();
    const [detailsProject, setDetailsProject] = useState<Project | null>(null);

    const loading = status === "loading";
    const rootPath = projectsRoot?.path ?? snapshot?.rootPath ?? null;

    const pinned = useMemo(() => allProjects.filter((project) => favorites.includes(project.path)).slice(0, PINNED_LIMIT), [allProjects, favorites]);

    const selectTech = (technology: Technology) => {
        setActiveTech(technology);
        onNavigate("projects");
    };

    return (
        <div className="space-y-5">
            <PageHeader
                section="OVERVIEW"
                index="00"
                title="Workspace overview"
                description="A live readout of the projects, stacks, and workspaces Orbit has indexed."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={() => onNavigate("settings")}>
                            <FolderOpen className="size-3.5" />
                            Workspace root
                        </Button>
                        <Button variant="primary" size="sm" onClick={reScan} disabled={reScanning}>
                            <RefreshCw className={cn("size-3.5", reScanning && "animate-spin")} />
                            {reScanning ? "Scanning…" : "Re-scan"}
                        </Button>
                    </>
                }
            />

            {status === "ready" && error ? <ScanErrorBanner error={error} onRetry={reScan} onDismiss={dismissError} /> : null}

            {loading ? <OverviewSkeleton /> : null}

            {status === "error" && error ? <ScannerOfflineState error={error} onRetry={reload} /> : null}

            {status === "ready" && allProjects.length === 0 ? (
                <EmptyState
                    icon={FolderSearch}
                    label="INDEX EMPTY"
                    title="No projects indexed yet"
                    description={
                        <>
                            Orbit scanned <span className="font-mono text-ink">{rootPath ? shortenPath(rootPath, 46) : "your projects directory"}</span> and found nothing. If your projects live
                            somewhere else, point Orbit at a different folder.
                        </>
                    }
                    action={
                        <>
                            <ChangeFolderButton />
                            <Button variant="secondary" onClick={reScan} disabled={reScanning}>
                                <RefreshCw className={cn("size-3.5", reScanning && "animate-spin")} />
                                {reScanning ? "Scanning…" : "Re-scan workspace"}
                            </Button>
                        </>
                    }
                />
            ) : null}

            {status === "ready" && allProjects.length > 0 ? (
                <>
                    <Deck
                        loading={loading}
                        rootPath={rootPath}
                        projectCount={allProjects.length}
                        workspaceCount={workspaces.length}
                        techCount={technologies.length}
                        scannedAt={snapshot?.scannedAt ?? null}
                    />

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                        <div className="min-w-0 space-y-4">
                            <Panel>
                                <PanelHeader label="STACK INDEX" count={technologies.length} action={<PanelAction onClick={() => onNavigate("technologies")}>Browse all</PanelAction>} />
                                {technologies.length === 0 ? (
                                    <p className="px-4 py-6 font-mono text-[10px] text-ink-muted">No technologies detected in this workspace.</p>
                                ) : (
                                    <div>
                                        {technologies.slice(0, 8).map((item, index) => (
                                            <TechnologyRow key={item.name} item={item} rank={index + 1} max={technologies[0]?.count ?? 1} onSelect={() => selectTech(item)} />
                                        ))}
                                    </div>
                                )}
                            </Panel>

                            <Panel>
                                <PanelHeader label="PROJECT INDEX" count={allProjects.length} action={<PanelAction onClick={() => onNavigate("projects")}>View all</PanelAction>} />
                                <div>
                                    {allProjects.slice(0, FEATURED_LIMIT).map((project, index) => (
                                        <ProjectRow key={project.path} project={project} index={index + 1} onOpen={() => setDetailsProject(project)} onSelectTech={selectTech} />
                                    ))}
                                </div>
                            </Panel>
                        </div>

                        <div className="min-w-0 space-y-4">
                            <Panel>
                                <PanelHeader label="WORKSPACES" count={workspaces.length} action={<PanelAction onClick={() => onNavigate("workspaces")}>View all</PanelAction>} />
                                {workspaces.length === 0 ? (
                                    <div className="px-4 py-5">
                                        <p className="text-[12px] leading-relaxed text-ink-soft">
                                            No workspace roots found. Orbit groups projects that live inside a package manifest with a workspaces field.
                                        </p>
                                        <Button variant="ghost" size="sm" className="mt-3 -ml-2" onClick={() => onNavigate("workspaces")}>
                                            <Boxes className="size-3.5" />
                                            Inspect workspaces
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        {workspaces.slice(0, FEATURED_LIMIT).map((workspace) => (
                                            <WorkspaceRow key={workspace.path} workspace={workspace} onOpen={() => onNavigate("workspaces")} />
                                        ))}
                                    </div>
                                )}
                            </Panel>

                            <Panel>
                                <PanelHeader label="PINNED" count={favorites.length} action={<PanelAction onClick={() => onNavigate("favorites")}>Open</PanelAction>} />
                                {pinned.length === 0 ? (
                                    <div className="px-4 py-5">
                                        <p className="text-[12px] leading-relaxed text-ink-soft">No pinned projects yet. Star a project from the index and it will surface here.</p>
                                        <Button variant="ghost" size="sm" className="mt-3 -ml-2" onClick={() => onNavigate("projects")}>
                                            <Star className="size-3.5" />
                                            Browse projects
                                        </Button>
                                    </div>
                                ) : (
                                    <div>
                                        {pinned.map((project) => (
                                            <button
                                                key={project.path}
                                                type="button"
                                                onClick={() => setDetailsProject(project)}
                                                className="group flex w-full items-center gap-2.5 border-b border-line-soft px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-white/2 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset"
                                            >
                                                <Star className="size-3 shrink-0 text-amber-300" fill="currentColor" strokeWidth={1.5} />
                                                <Monogram name={project.name} size="sm" />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-[12px] font-medium text-ink">{project.name || "Untitled project"}</span>
                                                    <span className="block truncate font-mono text-[9px] text-ink-muted" title={project.path}>
                                                        {shortenPath(project.path, 36)}
                                                    </span>
                                                </span>
                                                <ArrowUpRight className="size-3 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </Panel>
                        </div>
                    </div>
                </>
            ) : null}

            <ProjectDetails
                project={detailsProject}
                onClose={() => setDetailsProject(null)}
                onSelectTech={(tech) => {
                    selectTech(tech);
                    setDetailsProject(null);
                }}
            />
        </div>
    );
}

function Deck({
    loading,
    rootPath,
    projectCount,
    workspaceCount,
    techCount,
    scannedAt,
}: {
    loading: boolean;
    rootPath: string | null;
    projectCount: number;
    workspaceCount: number;
    techCount: number;
    scannedAt: number | null;
}) {
    const cells: { label: string; value: string; hint: string; index: string; numeric?: boolean }[] = [
        { label: "PROJECTS", value: String(projectCount), hint: "All indexed roots", index: "01", numeric: true },
        { label: "WORKSPACES", value: String(workspaceCount), hint: "Multi-package groups", index: "02", numeric: true },
        { label: "TECHNOLOGIES", value: String(techCount), hint: "Distinct stacks detected", index: "03", numeric: true },
        { label: "DIRECTORY", value: rootPath ? getBaseName(rootPath) : "—", hint: rootPath ? shortenPath(rootPath, 32) : "Not configured", index: "04" },
        {
            label: "LAST SCAN",
            value: scannedAt ? formatRelativeTime(scannedAt) : "—",
            hint: scannedAt ? new Date(scannedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "No scan recorded",
            index: "05",
        },
    ];

    return (
        <section aria-label="Workspace readout" className="grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-line bg-line md:grid-cols-3 xl:grid-cols-5">
            {cells.map((cell) => (
                <div key={cell.label} className="min-w-0 bg-panel p-4">
                    <div className="flex items-center justify-between gap-2">
                        <p className="label-mono text-ink-muted">{cell.label}</p>
                        <span className="font-mono text-[9px] text-ink-muted/50">{cell.index}</span>
                    </div>
                    {loading ? (
                        <div className="mt-3 space-y-2">
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="h-2.5 w-24" />
                        </div>
                    ) : (
                        <>
                            <p
                                className={cn("mt-2.5 truncate font-mono tracking-tight text-ink tabular-nums", cell.numeric ? "text-[28px] leading-none" : "text-[14px] leading-tight")}
                                title={cell.value}
                            >
                                {cell.value}
                            </p>
                            <p className="mt-1.5 truncate font-mono text-[9px] tracking-[0.02em] text-ink-muted" title={cell.hint}>
                                {cell.hint}
                            </p>
                        </>
                    )}
                </div>
            ))}
        </section>
    );
}

function Panel({ children }: { children: ReactNode }) {
    return <section className="overflow-hidden rounded-[2px] border border-line bg-panel">{children}</section>;
}

function PanelHeader({ label, count, action }: { label: string; count?: number; action?: ReactNode }) {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5">
            <div className="flex min-w-0 items-center gap-2">
                <span className="label-mono text-ink-muted">{label}</span>
                {typeof count === "number" ? <span className="font-mono text-[9px] tabular-nums text-ink-muted/60">{String(count).padStart(2, "0")}</span> : null}
            </div>
            {action}
        </div>
    );
}

function PanelAction({ children, onClick }: { children: ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1 font-mono text-[9px] tracking-[0.08em] text-ink-muted uppercase transition-colors hover:text-ink focus-visible:ring-1 focus-visible:ring-accent"
        >
            {children}
            <ChevronRight className="size-3" />
        </button>
    );
}

function TechnologyRow({ item, rank, max, onSelect }: { item: TechnologyStat; rank: number; max: number; onSelect: () => void }) {
    const meta = getCategoryMeta(item.category);

    return (
        <button
            type="button"
            onClick={onSelect}
            className="group grid w-full grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line-soft px-4 py-2 text-left transition-colors last:border-b-0 hover:bg-white/2 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset"
        >
            <span className="font-mono text-[9px] tabular-nums text-ink-muted/70">{String(rank).padStart(2, "0")}</span>
            <span className="min-w-0">
                <span className="flex items-center gap-2">
                    <TechIcon name={item.name} className="size-3.5" />
                    <span className="truncate text-[12px] font-medium text-ink">{getTechLabel(item.name)}</span>
                    <span className="hidden font-mono text-[8px] tracking-[0.12em] text-ink-muted/60 sm:inline">{meta.short}</span>
                </span>
                <DataBar value={item.count / max} segments={24} className="mt-1.5" />
            </span>
            <span className="font-mono text-[10px] tabular-nums text-ink-soft group-hover:text-ink">{String(item.count).padStart(2, "0")}</span>
        </button>
    );
}

function ProjectRow({ project, index, onOpen, onSelectTech }: { project: Project; index: number; onOpen: () => void; onSelectTech: (technology: Technology) => void }) {
    return (
        <div onClick={onOpen} className="group flex cursor-pointer items-center gap-3 border-b border-line-soft px-4 py-2.5 transition-colors last:border-b-0 hover:bg-white/2">
            <span className="font-mono text-[9px] tabular-nums text-ink-muted/70">P-{String(index).padStart(2, "0")}</span>
            <Monogram name={project.name} size="sm" />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-ink">{project.name || "Untitled project"}</p>
                <p className="truncate font-mono text-[9px] text-ink-muted" title={project.path}>
                    {shortenPath(project.path, 46)}
                </p>
            </div>
            <div className="hidden shrink-0 items-center gap-1 md:flex" onClick={(event) => event.stopPropagation()}>
                {project.technologies.slice(0, 2).map((tech) => (
                    <TechBadge key={tech.name} technology={tech} onClick={() => onSelectTech(tech)} />
                ))}
                {project.technologies.length > 2 ? <span className="font-mono text-[9px] text-ink-muted">+{project.technologies.length - 2}</span> : null}
            </div>
            <ChevronRight className="size-3.5 shrink-0 text-ink-muted opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
    );
}

function WorkspaceRow({ workspace, onOpen }: { workspace: Workspace; onOpen: () => void }) {
    const top = useMemo(() => aggregateTechnologies(workspace.projects).slice(0, 3), [workspace.projects]);

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group flex w-full flex-col gap-1.5 border-b border-line-soft px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-white/2 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset"
        >
            <span className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-2">
                    <Boxes className="size-3.5 shrink-0 text-ink-muted" strokeWidth={1.6} />
                    <span className="truncate text-[12px] font-medium text-ink">{workspace.name}</span>
                </span>
                <span className="shrink-0 font-mono text-[9px] tabular-nums text-ink-muted">{pluralize(workspace.projects.length, "project")}</span>
            </span>
            <span className="truncate pl-5 font-mono text-[9px] text-ink-muted" title={workspace.path}>
                {shortenPath(workspace.path, 40)}
            </span>
            {top.length > 0 ? (
                <span className="flex flex-wrap items-center gap-1 pl-5">
                    {top.map((tech) => (
                        <span key={tech.name} className="inline-flex items-center gap-1 font-mono text-[9px] text-ink-muted">
                            <TechIcon name={tech.name} className="size-3" />
                            {getTechLabel(tech.name)}
                        </span>
                    ))}
                </span>
            ) : null}
        </button>
    );
}

function aggregateTechnologies(projects: Project[]): TechnologyStat[] {
    const counts = new Map<string, TechnologyStat>();
    for (const project of projects) {
        for (const tech of project.technologies) {
            const existing = counts.get(tech.name);
            if (existing) {
                existing.count += 1;
            } else {
                counts.set(tech.name, { name: tech.name, category: tech.category, count: 1 });
            }
        }
    }
    return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function OverviewSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[2px] border border-line bg-line md:grid-cols-3 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div key={index} className="bg-panel p-4">
                        <Skeleton className="h-2.5 w-16" />
                        <Skeleton className="mt-3 h-7 w-12" />
                        <Skeleton className="mt-2 h-2.5 w-24" />
                    </div>
                ))}
            </div>
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                <div className="space-y-4">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-56 w-full" />
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-44 w-full" />
                    <Skeleton className="h-44 w-full" />
                </div>
            </div>
        </div>
    );
}
