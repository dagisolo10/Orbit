import { ScanErrorBanner, ScannerOfflineState } from "@/components/common/scanner-offline-state";
import { ProjectDetails } from "@/components/projects/project-detail";
import { ProjectGrid } from "@/components/projects/project-grid";
import { ProjectList } from "@/components/projects/project-list";
import { Button } from "@/components/ui/button";
import { Dropdown, type DropdownItem } from "@/components/ui/dropdown";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { TechBadge } from "@/components/ui/tech-badge";
import { useOrbit } from "@/contexts/orbit-context";
import { useVisibleProjects } from "@/hooks/use-visible-projects";
import { pluralize } from "@/lib/format";
import { getCategoryMeta } from "@/lib/tech";
import { cn } from "@/lib/utils";
import type { Project, ProjectScope, SortKey, ViewMode } from "@/types/project";
import { ArrowUpDown, Boxes, FolderSearch, LayoutGrid, List, RefreshCw, SearchX, Star, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

const SORT_LABELS: Record<SortKey, string> = {
    "name-asc": "Name (A–Z)",
    "name-desc": "Name (Z–A)",
    "tech-desc": "Most technologies",
    "tech-asc": "Fewest technologies",
    "path-asc": "Path (A–Z)",
};

const PAGE_SIZE = 12;

export function ProjectExplorer({ scope }: { scope: ProjectScope }) {
    const {
        status,
        error,
        reload,
        reScan,
        reScanning,
        dismissError,
        projects,
        allProjects,
        favorites,
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
        workspaces,
    } = useOrbit();
    const visible = useVisibleProjects(scope);
    const [detailsProject, setDetailsProject] = useState<Project | null>(null);
    const [page, setPage] = useState(1);

    useEffect(() => {
        setPage(1);
    }, [query, activeTech, activeCategory, sortKey, scope]);

    const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageProjects = visible.slice(pageStart, pageStart + PAGE_SIZE);

    const total = scope === "favorites" ? allProjects.filter((project) => favorites.includes(project.path)).length : projects.length;

    if (status === "loading") return <ExplorerSkeleton viewMode={viewMode} />;
    if (status === "error" && error) return <ScannerOfflineState error={error} onRetry={reload} />;

    if (scope === "all" && projects.length === 0) {
        if (workspaces.length > 0) {
            return <EmptyState icon={Boxes} title="No standalone projects" description="Every project Orbit found lives inside a workspace. Open the Workspaces view to browse them." />;
        }

        return (
            <EmptyState
                icon={FolderSearch}
                title="No projects found yet"
                description="Orbit scans your projects directory for package.json files. Add a project, then run a re-scan to populate your workspace."
                action={
                    <Button variant="primary" onClick={reScan} disabled={reScanning}>
                        <RefreshCw className={cn("size-3.5", reScanning && "animate-spin")} />
                        {reScanning ? "Scanning…" : "Re-scan workspace"}
                    </Button>
                }
            />
        );
    }

    if (scope === "favorites" && favorites.length === 0) {
        return <EmptyState icon={Star} title="No favorites yet" description="Star a project from the explorer and it will appear here for quick access." />;
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
                    {hasActiveFilters ? (
                        <>
                            Showing <span className="font-medium text-foreground">{visible.length}</span> of {pluralize(total, "project")}
                        </>
                    ) : (
                        pluralize(total, "project")
                    )}
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

            {visible.length === 0 ? (
                <EmptyState
                    icon={SearchX}
                    title="No matching projects"
                    description="No projects match the current filters. Try a different search or clear the active filters."
                    action={
                        <Button variant="secondary" size="sm" onClick={clearFilters}>
                            Clear filters
                        </Button>
                    }
                />
            ) : viewMode === "grid" ? (
                <ProjectGrid projects={pageProjects} onOpenDetails={setDetailsProject} onSelectTech={setActiveTech} />
            ) : (
                <ProjectList projects={pageProjects} onOpenDetails={setDetailsProject} onSelectTech={setActiveTech} />
            )}

            <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />

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

function ExplorerSkeleton({ viewMode }: { viewMode: ViewMode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="ml-auto h-8 w-40" />
            </div>

            {viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-3">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <div key={index} className="rounded-xl border border-white/8 bg-card p-3.5">
                            <div className="flex items-start gap-3">
                                <Skeleton className="size-9 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-32" />
                                    <Skeleton className="h-2.5 w-40" />
                                </div>
                            </div>
                            <div className="mt-3.5 flex gap-1.5">
                                <Skeleton className="h-4 w-14 rounded-md" />
                                <Skeleton className="h-4 w-16 rounded-md" />
                                <Skeleton className="h-4 w-12 rounded-md" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-white/8 bg-white/1.5">
                    <div className="hidden border-b border-white/8 px-3 py-2 md:block">
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="divide-y divide-white/6">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 px-3 py-2.5">
                                <Skeleton className="size-7 shrink-0 rounded-lg" />
                                <Skeleton className="h-3.5 w-40" />
                                <Skeleton className="ml-auto hidden h-4 w-24 rounded-md md:block" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
