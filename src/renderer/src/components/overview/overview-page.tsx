import { ScanErrorBanner, ScannerOfflineState } from "@/components/common/scanner-offline-state";
import { StatStrip, type StatItem } from "@/components/overview/stat-strip";
import { ProjectDetails } from "@/components/projects/project-detail";
import { ProjectGrid } from "@/components/projects/project-grid";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TechBadge } from "@/components/ui/tech-badge";
import { useOrbit, type TechnologyStat } from "@/contexts/orbit-context";
import { formatRelativeTime, getBaseName, pluralize, shortenPath } from "@/lib/format";
import type { ViewId } from "@/types/navigation";
import type { Project, Technology, Workspace } from "@/types/project";
import { Boxes, CalendarClock, ChevronRight, FolderKanban, FolderOpen, FolderSearch, Layers } from "lucide-react";
import { useState } from "react";

const FEATURED_LIMIT = 6;

export function OverviewPage({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    const { status, error, reload, reScan, dismissError, allProjects, workspaces, technologies, snapshot, setActiveTech } = useOrbit();
    const [detailsProject, setDetailsProject] = useState<Project | null>(null);

    const loading = status === "loading";
    const rootPath = snapshot?.rootPath ?? null;

    const stats: StatItem[] = [
        {
            label: "Projects",
            value: loading ? "—" : String(allProjects.length),
            hint: loading ? undefined : allProjects.length > 0 ? "Discovered in your workspace" : "None discovered yet",
            icon: FolderKanban,
        },
        {
            label: "Workspaces",
            value: loading ? "—" : String(workspaces.length),
            hint: loading ? undefined : workspaces.length > 0 ? "Multi-package groups" : "None discovered yet",
            icon: Boxes,
        },
        { label: "Technologies", value: loading ? "—" : String(technologies.length), hint: loading ? undefined : "Distinct stacks detected", icon: Layers },
        { label: "Directory", value: rootPath ? getBaseName(rootPath) : "—", hint: rootPath ? shortenPath(rootPath, 28) : "Not configured", icon: FolderOpen },
        { label: "Last scan", value: snapshot?.scannedAt ? formatRelativeTime(snapshot.scannedAt) : "—", hint: snapshot?.scannedAt ? undefined : "No scan recorded", icon: CalendarClock },
    ];

    const selectTech = (technology: Technology) => {
        setActiveTech(technology);
        onNavigate("projects");
    };

    return (
        <div className="space-y-6">
            <StatStrip items={stats} loading={loading} />

            {status === "ready" && error ? <ScanErrorBanner error={error} onRetry={reScan} onDismiss={dismissError} /> : null}

            {loading ? <OverviewSkeleton /> : null}

            {status === "error" && error ? <ScannerOfflineState error={error} onRetry={reload} /> : null}

            {status === "ready" && allProjects.length === 0 ? (
                <EmptyState
                    icon={FolderSearch}
                    title="No projects yet"
                    description="Orbit scans your projects directory for package.json files. Once projects are found they will appear here with their detected technologies."
                    action={
                        <Button variant="primary" onClick={reload}>
                            Re-scan workspace
                        </Button>
                    }
                />
            ) : null}

            {status === "ready" && technologies.length > 0 ? (
                <section className="space-y-3">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Top technologies</h2>
                            <p className="text-xs text-muted-foreground">The stacks that show up most across your projects.</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onNavigate("technologies")}>
                            Browse all
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {technologies.slice(0, 8).map((item) => (
                            <button
                                key={item.name}
                                type="button"
                                onClick={() => selectTech(item)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-white/8 bg-white/2 px-2 py-1 outline-none transition-colors hover:border-white/14 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <TechBadge technology={item} />
                                <span className="text-[11px] tabular-nums text-muted-foreground">{item.count}</span>
                            </button>
                        ))}
                    </div>
                </section>
            ) : null}

            {status === "ready" && workspaces.length > 0 ? (
                <section className="space-y-3">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Workspaces</h2>
                            <p className="text-xs text-muted-foreground">Monorepos and multi-package roots Orbit grouped together.</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onNavigate("workspaces")}>
                            View all
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-3">
                        {workspaces.slice(0, FEATURED_LIMIT).map((workspace) => (
                            <WorkspaceCard key={workspace.path} workspace={workspace} onOpen={() => onNavigate("workspaces")} />
                        ))}
                    </div>
                </section>
            ) : null}

            {status === "ready" && allProjects.length > 0 ? (
                <section className="space-y-3">
                    <div className="flex items-end justify-between gap-4">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
                            <p className="text-xs text-muted-foreground">A snapshot of what Orbit found in your workspace.</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => onNavigate("projects")}>
                            View all
                            <ChevronRight className="size-3.5" />
                        </Button>
                    </div>
                    <ProjectGrid projects={allProjects.slice(0, FEATURED_LIMIT)} onOpenDetails={setDetailsProject} onSelectTech={selectTech} />
                </section>
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

function WorkspaceCard({ workspace, onOpen }: { workspace: Workspace; onOpen: () => void }) {
    const technologies = aggregateTechnologies(workspace.projects);

    return (
        <button
            type="button"
            onClick={onOpen}
            className="flex flex-col gap-3 rounded-2xl border min-h-35 border-white/8 bg-white/1.5 p-4 text-left outline-none transition-colors hover:border-white/14 hover:bg-white/4 focus-visible:ring-2 focus-visible:ring-ring"
        >
            <div className="flex items-center gap-3">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-muted-foreground">
                    <Boxes className="size-4" strokeWidth={1.85} />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">{workspace.name}</p>
                    <p className="truncate font-mono text-[11px] text-muted-foreground" title={workspace.path}>
                        {shortenPath(workspace.path, 40)}
                    </p>
                </div>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{pluralize(workspace.projects.length, "project")}</span>
            </div>
            {technologies.length > 0 ? (
                <div className="flex mt-auto flex-wrap gap-1.5">
                    {technologies.slice(0, 4).map((tech) => (
                        <TechBadge key={tech.name} technology={tech} />
                    ))}
                </div>
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
        <div className="space-y-6">
            <div className="space-y-3">
                <Skeleton className="h-5 w-32" />
                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton key={index} className="h-28" />
                    ))}
                </div>
            </div>
        </div>
    );
}
