import { ScanErrorBanner, ScannerOfflineState } from "@/components/common/scanner-offline-state";
import { ChangeFolderButton } from "@/components/common/change-folder-button";
import { ProjectDetails } from "@/components/projects/project-detail";
import { ProjectGrid } from "@/components/projects/project-grid";
import { ProjectList } from "@/components/projects/project-list";
import { Button } from "@/components/ui/button";
import { Dropdown, type DropdownItem } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { TechBadge } from "@/components/ui/tech-badge";
import { WorkspaceMenu } from "@/components/workspaces/workspace-menu";
import { useOrbit } from "@/contexts/orbit-context";
import { sortProjects } from "@/hooks/use-visible-projects";
import { pluralize, shortenPath } from "@/lib/format";
import { getCategoryMeta } from "@/lib/tech";
import { cn } from "@/lib/utils";
import type { Project, SortKey, ViewMode, Workspace } from "@/types/project";
import { ArrowUpDown, Boxes, ChevronDown, ChevronsDownUp, ChevronsUpDown, LayoutGrid, List, RefreshCw, SearchX, X } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";

const SORT_LABELS: Record<SortKey, string> = {
    "name-asc": "Name (A–Z)",
    "name-desc": "Name (Z–A)",
    "tech-desc": "Most technologies",
    "tech-asc": "Fewest technologies",
    "path-asc": "Path (A–Z)",
};

export function WorkspacesView() {
    const {
        status,
        error,
        reload,
        reScan,
        reScanning,
        dismissError,
        workspaces,
        viewMode,
        setViewMode,
        sortKey,
        setSortKey,
        activeTech,
        setActiveTech,
        activeCategory,
        setActiveCategory,
        query,
        setQuery,
        clearFilters,
        hasActiveFilters,
        allProjects,
        snapshot,
        projectsRoot,
    } = useOrbit();

    const term = query.trim().toLowerCase();
    const totalProjects = useMemo(() => workspaces.reduce((sum, workspace) => sum + workspace.projects.length, 0), [workspaces]);
    const rootPath = projectsRoot?.path ?? snapshot?.rootPath ?? null;
    const noProjectsAtAll = allProjects.length === 0;

    const groups = useMemo(() => {
        const matches = (project: Project) => {
            if (activeTech && !project.technologies.some((tech) => tech.name === activeTech.name)) return false;
            if (activeCategory && !project.technologies.some((tech) => tech.category === activeCategory)) return false;
            if (term) {
                const haystack = `${project.name} ${project.path} ${project.technologies.map((tech) => tech.name).join(" ")}`.toLowerCase();
                if (!haystack.includes(term)) return false;
            }
            return true;
        };

        const sortGroups = (a: { workspace: Workspace }, b: { workspace: Workspace }) => {
            if (sortKey === "path-asc") return a.workspace.path.localeCompare(b.workspace.path, undefined, { sensitivity: "base" });
            const direction = sortKey === "name-desc" ? -1 : 1;
            return direction * a.workspace.name.localeCompare(b.workspace.name, undefined, { sensitivity: "base" });
        };

        return workspaces
            .map((workspace) => ({ workspace, projects: sortProjects(workspace.projects.filter(matches), sortKey) }))
            .filter((group) => !hasActiveFilters || group.projects.length > 0)
            .sort(sortGroups);
    }, [workspaces, activeTech, activeCategory, term, sortKey, hasActiveFilters]);

    const [detailsProject, setDetailsProject] = useState<Project | null>(null);
    const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(groups.map((group) => group.workspace.path)));

    const toggle = (path: string) => {
        setCollapsed((previous) => {
            const next = new Set(previous);
            if (next.has(path)) {
                next.delete(path);
            } else {
                next.add(path);
            }
            return next;
        });
    };

    const expandAll = () => setCollapsed(new Set());
    const collapseAll = () => setCollapsed(new Set(groups.map((group) => group.workspace.path)));

    if (status === "loading") return <WorkspacesSkeleton />;
    if (status === "error" && error) return <ScannerOfflineState error={error} onRetry={reload} />;

    if (workspaces.length === 0) {
        return (
            <EmptyState
                icon={Boxes}
                title="No workspaces found"
                description={
                    noProjectsAtAll ? (
                        <>
                            Orbit scanned <span className="font-mono text-foreground/80">{rootPath ? shortenPath(rootPath, 46) : "your projects directory"}</span> and found no projects at all. If your
                            projects live somewhere else, pick a different folder.
                        </>
                    ) : (
                        "Orbit groups projects that live inside a workspace root — a package.json with a workspaces field. Add one to your projects directory, then run a re-scan."
                    )
                }
                action={
                    <>
                        {noProjectsAtAll ? <ChangeFolderButton /> : null}
                        <Button variant={noProjectsAtAll ? "secondary" : "primary"} onClick={reScan} disabled={reScanning}>
                            <RefreshCw className={cn("size-3.5", reScanning && "animate-spin")} />
                            {reScanning ? "Scanning…" : "Re-scan workspace"}
                        </Button>
                    </>
                }
            />
        );
    }

    const sortItems: DropdownItem[] = (Object.keys(SORT_LABELS) as SortKey[]).map((key) => ({
        id: key,
        label: SORT_LABELS[key],
        checked: sortKey === key,
        onSelect: () => setSortKey(key),
    }));

    return (
        <div className="space-y-4">
            {error ? <ScanErrorBanner error={error} onRetry={reScan} onDismiss={dismissError} /> : null}

            <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-[13px] text-muted-foreground">
                    {pluralize(workspaces.length, "workspace")} · <span className="font-medium text-foreground">{pluralize(totalProjects, "project")}</span>
                </p>

                {activeTech ? <FilterChip label={<TechBadge technology={activeTech} />} onClear={() => setActiveTech(null)} /> : null}
                {activeCategory ? (
                    <FilterChip
                        label={
                            <span className="inline-flex items-center gap-1.5 text-[11px]">
                                <span className={cn("size-1.5 rounded-full", getCategoryMeta(activeCategory).dotClassName)} aria-hidden />
                                <span className="font-medium text-foreground/80">{getCategoryMeta(activeCategory).label}</span>
                            </span>
                        }
                        onClear={() => setActiveCategory(null)}
                    />
                ) : null}
                {query.trim() ? <FilterChip label={<span className="text-[11px] text-foreground/80">“{query.trim()}”</span>} onClear={() => setQuery("")} /> : null}
                {hasActiveFilters ? (
                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                        Clear all
                    </Button>
                ) : null}

                <div className="ml-auto flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={expandAll} title="Expand all workspaces">
                        <ChevronsUpDown className="size-3.5" />
                        <span className="hidden lg:inline">Expand all</span>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={collapseAll} title="Collapse all workspaces">
                        <ChevronsDownUp className="size-3.5" />
                        <span className="hidden lg:inline">Collapse all</span>
                    </Button>
                    <Dropdown
                        items={sortItems}
                        label="Sort projects"
                        align="end"
                        renderTrigger={(props) => (
                            <Button variant="secondary" size="sm" {...props}>
                                <ArrowUpDown className="size-3.5" />
                                <span className="hidden lg:inline">{SORT_LABELS[sortKey]}</span>
                                <span className="lg:hidden">Sort</span>
                            </Button>
                        )}
                    />
                    <Segmented<ViewMode>
                        options={[
                            { value: "grid", label: "Grid", icon: LayoutGrid },
                            { value: "list", label: "List", icon: List },
                        ]}
                        value={viewMode}
                        onChange={setViewMode}
                    />
                </div>
            </div>

            {groups.length === 0 ? (
                <EmptyState
                    icon={SearchX}
                    title="No matching projects"
                    description="No projects inside your workspaces match the current filters. Try a different search or clear the active filters."
                    action={
                        <Button variant="secondary" size="sm" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-4">
                    {groups.map(({ workspace, projects }) => {
                        const isCollapsed = collapsed.has(workspace.path);
                        return (
                            <section key={workspace.path} className="overflow-hidden rounded-2xl border border-white/8 bg-white/1.5">
                                <div className="flex items-center gap-2 px-4 py-3">
                                    <button
                                        type="button"
                                        onClick={() => toggle(workspace.path)}
                                        aria-expanded={!isCollapsed}
                                        className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-muted-foreground">
                                            <Boxes className="size-4" strokeWidth={1.85} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-foreground">{workspace.name}</p>
                                            <p className="truncate font-mono text-[11px] text-muted-foreground" title={workspace.path}>
                                                {shortenPath(workspace.path, 60)}
                                            </p>
                                        </div>
                                        <span className="hidden shrink-0 text-xs tabular-nums text-muted-foreground sm:inline">{pluralize(workspace.projects.length, "project")}</span>
                                        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isCollapsed && "-rotate-90")} />
                                    </button>

                                    <WorkspaceMenu workspace={workspace} />
                                </div>

                                {!isCollapsed ? (
                                    <div className="border-t border-white/6 p-3">
                                        {projects.length === 0 ? (
                                            <EmptyState
                                                icon={Boxes}
                                                title="No projects in this workspace"
                                                description="Orbit found this workspace root, but there are no package.json projects inside it yet."
                                                className="border-none bg-transparent px-6 py-8"
                                            />
                                        ) : viewMode === "grid" ? (
                                            <ProjectGrid projects={projects} onOpenDetails={setDetailsProject} onSelectTech={setActiveTech} />
                                        ) : (
                                            <ProjectList projects={projects} onOpenDetails={setDetailsProject} onSelectTech={setActiveTech} />
                                        )}
                                    </div>
                                ) : null}
                            </section>
                        );
                    })}
                </div>
            )}

            <ProjectDetails
                project={detailsProject}
                onClose={() => setDetailsProject(null)}
                onSelectTech={(tech) => {
                    setActiveTech(tech);
                    setDetailsProject(null);
                }}
            />
        </div>
    );
}

function FilterChip({ label, onClear }: { label: ReactNode; onClear: () => void }) {
    return (
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/4 py-1 pr-1 pl-2 text-muted-foreground">
            {label}
            <button
                type="button"
                onClick={onClear}
                aria-label="Clear filter"
                className="inline-flex size-4 items-center justify-center rounded transition-colors hover:bg-white/10 hover:text-foreground"
            >
                <X className="size-3" />
            </button>
        </span>
    );
}

function WorkspacesSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="ml-auto h-8 w-40" />
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-2xl border border-white/8 bg-white/1.5">
                    <div className="flex items-center gap-3 px-4 py-3">
                        <Skeleton className="size-9 shrink-0 rounded-lg" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-40" />
                            <Skeleton className="h-2.5 w-64" />
                        </div>
                        <Skeleton className="h-4 w-4 rounded" />
                    </div>
                    <div className="border-t border-white/6 p-3">
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-3">
                            {Array.from({ length: 3 }).map((_, cardIndex) => (
                                <Skeleton key={cardIndex} className="h-35" />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
