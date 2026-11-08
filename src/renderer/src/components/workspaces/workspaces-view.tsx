import { ChangeFolderButton } from "@/components/common/change-folder-button";
import { ScanErrorBanner, ScannerOfflineState } from "@/components/common/scanner-offline-state";
import { ProjectDetails } from "@/components/projects/project-detail";
import { ProjectGrid } from "@/components/projects/project-grid";
import { ProjectList } from "@/components/projects/project-list";
import { Button } from "@/components/ui/button";
import { Dropdown, type DropdownItem } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip } from "@/components/ui/filter-chip";
import { PageHeader } from "@/components/ui/page-header";
import { SearchField } from "@/components/ui/search-field";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { TechBadge } from "@/components/ui/tech-badge";
import { WorkspaceMenu } from "@/components/workspaces/workspace-menu";
import { useOrbit } from "@/contexts/orbit-context";
import { useViewSearch } from "@/hooks/use-view-search";
import { sortProjects } from "@/hooks/use-visible-projects";
import { pluralize, shortenPath } from "@/lib/format";
import { getCategoryMeta } from "@/lib/tech";
import { cn } from "@/lib/utils";
import { VIEW_META } from "@/types/navigation";
import type { Project, SortKey, ViewMode, Workspace } from "@/types/project";
import { ArrowUpDown, Boxes, ChevronDown, ChevronsDownUp, ChevronsUpDown, LayoutGrid, List, RefreshCw, SearchX } from "lucide-react";
import { useMemo, useState } from "react";

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
        clearFilters,
        hasActiveFilters,
        allProjects,
        snapshot,
        projectsRoot,
    } = useOrbit();

    const { query, setQuery, inputRef: searchRef, clearSearch } = useViewSearch("workspaces");
    const term = query.trim().toLowerCase();
    const hasFilters = hasActiveFilters || term.length > 0;
    const totalProjects = useMemo(() => workspaces.reduce((sum, workspace) => sum + workspace.projects.length, 0), [workspaces]);
    const rootPath = projectsRoot?.path ?? snapshot?.rootPath ?? null;
    const noProjectsAtAll = allProjects.length === 0;
    const clearAll = () => {
        clearFilters();
        clearSearch();
    };

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
            .filter((group) => !hasFilters || group.projects.length > 0)
            .sort(sortGroups);
    }, [workspaces, activeTech, activeCategory, term, sortKey, hasFilters]);

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

    const meta = VIEW_META.workspaces;

    const header = (
        <PageHeader
            section={meta.section}
            index={meta.index}
            title={meta.title}
            description={meta.subtitle}
            actions={
                <>
                    <Button variant="outline" size="sm" onClick={expandAll} title="Expand all workspaces">
                        <ChevronsUpDown className="size-3.5" />
                        <span className="hidden lg:inline">Expand all</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={collapseAll} title="Collapse all workspaces">
                        <ChevronsDownUp className="size-3.5" />
                        <span className="hidden lg:inline">Collapse all</span>
                    </Button>
                </>
            }
        />
    );

    if (status === "loading") {
        return (
            <div className="space-y-5">
                {header}
                <WorkspacesSkeleton />
            </div>
        );
    }

    if (status === "error" && error) {
        return (
            <div className="space-y-5">
                {header}
                <ScannerOfflineState error={error} onRetry={reload} />
            </div>
        );
    }

    if (workspaces.length === 0) {
        return (
            <div className="space-y-5">
                {header}
                <EmptyState
                    icon={Boxes}
                    label="NO GROUPS"
                    title="No workspaces found"
                    description={
                        noProjectsAtAll ? (
                            <>
                                Orbit scanned <span className="font-mono text-ink">{rootPath ? shortenPath(rootPath, 46) : "your projects directory"}</span> and found no projects at all. If your
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
            </div>
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
            {header}

            {error ? <ScanErrorBanner error={error} onRetry={reScan} onDismiss={dismissError} /> : null}

            <div className="flex flex-wrap items-center gap-2 rounded-[2px] border border-line bg-panel px-3 py-2">
                <p className="font-mono text-[10px] tracking-[0.08em] text-ink-muted uppercase">
                    GROUPS <span className="text-ink tabular-nums">{String(workspaces.length).padStart(2, "0")}</span>
                    <span className="mx-1 text-ink-muted/40">/</span>
                    <span className="text-ink-soft tabular-nums">{String(totalProjects).padStart(2, "0")}</span> PRJ
                </p>

                <span aria-hidden className="mx-1 h-3.5 w-px bg-line" />

                {activeTech ? <FilterChip label={<TechBadge technology={activeTech} />} onClear={() => setActiveTech(null)} /> : null}
                {activeCategory ? (
                    <FilterChip
                        label={
                            <span className="inline-flex items-center gap-1.5 font-mono text-[10px]">
                                <span className="text-ink-soft">{getCategoryMeta(activeCategory).label}</span>
                            </span>
                        }
                        onClear={() => setActiveCategory(null)}
                    />
                ) : null}
                {hasFilters ? (
                    <button
                        type="button"
                        onClick={clearAll}
                        className="font-mono text-[9px] tracking-[0.08em] text-ink-muted uppercase underline-offset-2 outline-none transition-colors hover:text-ink hover:underline focus-visible:ring-1 focus-visible:ring-accent"
                    >
                        Clear all
                    </button>
                ) : null}

                <div className="ml-auto flex w-full items-center gap-2 sm:w-auto">
                    <SearchField inputRef={searchRef} value={query} onChange={setQuery} placeholder="Search workspaces…" ariaLabel="Search workspaces" />
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
                    label="NO MATCH"
                    title="No matching projects"
                    description="No projects inside your workspaces match the current filters. Try a different search or clear the active filters."
                    action={
                        <Button variant="secondary" size="sm" onClick={clearAll}>
                            Clear filters
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {groups.map(({ workspace, projects }, groupIndex) => {
                        const isCollapsed = collapsed.has(workspace.path);
                        return (
                            <section key={workspace.path} className="overflow-hidden rounded-[2px] border border-line bg-panel">
                                <div className="flex items-center gap-3 px-3 py-2.5">
                                    <span className="hidden font-mono text-[9px] tabular-nums text-ink-muted/70 sm:inline">WS-{String(groupIndex + 1).padStart(2, "0")}</span>
                                    <button
                                        type="button"
                                        onClick={() => toggle(workspace.path)}
                                        aria-expanded={!isCollapsed}
                                        className="flex min-w-0 flex-1 items-center gap-2.5 rounded-[1px] text-left outline-none focus-visible:ring-1 focus-visible:ring-accent"
                                    >
                                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-[1px] border border-line bg-panel-inset text-ink-muted">
                                            <Boxes className="size-3.5" strokeWidth={1.75} />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-[13px] font-medium text-ink">{workspace.name}</span>
                                            <span className="block truncate font-mono text-[9px] text-ink-muted" title={workspace.path}>
                                                {shortenPath(workspace.path, 60)}
                                            </span>
                                        </span>
                                        <span className="hidden shrink-0 font-mono text-[9px] tracking-[0.06em] text-ink-muted tabular-nums uppercase sm:inline">
                                            {pluralize(workspace.projects.length, "project")}
                                        </span>
                                        <ChevronDown className={cn("size-3.5 shrink-0 text-ink-muted transition-transform duration-150", isCollapsed && "-rotate-90")} />
                                    </button>

                                    <WorkspaceMenu workspace={workspace} />
                                </div>

                                {!isCollapsed ? (
                                    <div className="border-t border-line bg-panel-inset/40 p-3">
                                        {projects.length === 0 ? (
                                            <div className="dot-grid relative overflow-hidden rounded-[1px] border border-dashed border-line px-4 py-8 text-center">
                                                <p className="label-mono text-ink-muted">
                                                    <span className="text-accent">{"//"}</span> WORKSPACE EMPTY
                                                </p>
                                                <p className="mx-auto mt-1.5 max-w-md text-[12px] leading-relaxed text-ink-soft">
                                                    Orbit found this workspace root, but there are no package.json projects inside it yet.
                                                </p>
                                            </div>
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

function WorkspacesSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-[2px] border border-line bg-panel px-3 py-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="ml-auto h-7 w-32" />
                <Skeleton className="h-7 w-24" />
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[2px] border border-line bg-panel">
                    <div className="flex items-center gap-3 px-3 py-2.5">
                        <Skeleton className="size-7 shrink-0" />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <Skeleton className="h-3.5 w-40" />
                            <Skeleton className="h-2.5 w-64" />
                        </div>
                        <Skeleton className="size-4" />
                    </div>
                    <div className="border-t border-line p-3">
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
                            {Array.from({ length: 3 }).map((_, cardIndex) => (
                                <Skeleton key={cardIndex} className="h-40" />
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
