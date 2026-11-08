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
import { Pagination } from "@/components/ui/pagination";
import { SearchField } from "@/components/ui/search-field";
import { Segmented } from "@/components/ui/segmented";
import { Skeleton } from "@/components/ui/skeleton";
import { TechBadge } from "@/components/ui/tech-badge";
import { useOrbit } from "@/contexts/orbit-context";
import { useViewSearch } from "@/hooks/use-view-search";
import { useVisibleProjects } from "@/hooks/use-visible-projects";
import { shortenPath } from "@/lib/format";
import { getCategoryMeta } from "@/lib/tech";
import { cn } from "@/lib/utils";
import { VIEW_META } from "@/types/navigation";
import type { Project, ProjectScope, SortKey, ViewMode } from "@/types/project";
import { ArrowUpDown, Boxes, FolderSearch, LayoutGrid, List, RefreshCw, SearchX, Star } from "lucide-react";
import { useState } from "react";

const SORT_LABELS: Record<SortKey, string> = {
    "name-asc": "Name (A-Z)",
    "name-desc": "Name (Z-A)",
    "tech-desc": "Most technologies",
    "tech-asc": "Fewest technologies",
    "path-asc": "Path (A-Z)",
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
        clearFilters,
        hasActiveFilters,
        workspaces,
        snapshot,
        projectsRoot,
    } = useOrbit();
    const { query, setQuery, inputRef: searchRef, clearSearch } = useViewSearch(scope === "favorites" ? "favorites" : "projects");
    const visible = useVisibleProjects(scope, query);
    const [detailsProject, setDetailsProject] = useState<Project | null>(null);
    const [page, setPage] = useState(1);

    const rootPath = projectsRoot?.path ?? snapshot?.rootPath ?? null;
    const meta = VIEW_META[scope === "favorites" ? "favorites" : "projects"];
    const hasFilters = hasActiveFilters || query.trim().length > 0;

    const clearAll = () => {
        setPage(1);
        clearFilters();
        clearSearch();
    };

    const resetPage = (cb: () => void) => {
        setPage(1);
        cb();
    };

    const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageProjects = visible.slice(pageStart, pageStart + PAGE_SIZE);

    const total = scope === "favorites" ? allProjects.filter((project) => favorites.includes(project.path)).length : projects.length;

    const sortItems: DropdownItem[] = (Object.keys(SORT_LABELS) as SortKey[]).map((key) => ({
        id: key,
        label: SORT_LABELS[key],
        checked: sortKey === key,
        onSelect: () => resetPage(() => setSortKey(key)),
    }));

    const header = (
        <PageHeader
            section={meta.section}
            index={meta.index}
            title={meta.title}
            description={meta.subtitle}
            actions={
                scope === "all" ? (
                    <>
                        <ChangeFolderButton label="Change folder" />
                        <Button variant="outline" size="sm" onClick={reScan} disabled={reScanning}>
                            <RefreshCw className={cn("size-3.5", reScanning && "animate-spin")} />
                            {reScanning ? "Scanning…" : "Re-scan"}
                        </Button>
                    </>
                ) : undefined
            }
        />
    );

    if (status === "loading") {
        return (
            <div className="space-y-5">
                {header}
                <ExplorerSkeleton viewMode={viewMode} />
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

    if (scope === "all" && projects.length === 0) {
        return (
            <div className="space-y-5">
                {header}
                {workspaces.length > 0 ? (
                    <EmptyState
                        icon={Boxes}
                        label="NO STANDALONE PROJECTS"
                        title="No standalone projects"
                        description="Every project Orbit found lives inside a workspace. Open the Workspaces view to browse them."
                    />
                ) : (
                    <EmptyState
                        icon={FolderSearch}
                        label="INDEX EMPTY"
                        title="No projects found"
                        description={
                            <>
                                Orbit scanned <span className="font-mono text-ink">{rootPath ? shortenPath(rootPath, 46) : "your projects directory"}</span> and found no{" "}
                                <span className="font-mono">package.json</span> files. If your projects live somewhere else, pick a different folder.
                            </>
                        }
                        action={
                            <>
                                <ChangeFolderButton />
                                <Button variant="secondary" onClick={reScan} disabled={reScanning}>
                                    <RefreshCw className={cn("size-3.5", reScanning && "animate-spin")} />
                                    {reScanning ? "Scanning…" : "Re-scan"}
                                </Button>
                            </>
                        }
                    />
                )}
            </div>
        );
    }

    if (scope === "favorites" && favorites.length === 0) {
        return (
            <div className="space-y-5">
                {header}
                <EmptyState icon={Star} label="NO PINS" title="No favorites yet" description="Star a project from the explorer and it will appear here for quick access." />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {header}

            {error ? <ScanErrorBanner error={error} onRetry={reScan} onDismiss={dismissError} /> : null}

            <div className="flex flex-wrap items-center gap-2 rounded-[2px] border border-line bg-panel px-3 py-2">
                <p className="font-mono text-[10px] tracking-[0.08em] text-ink-muted uppercase">
                    INDEX <span className="text-ink tabular-nums">{String(visible.length).padStart(2, "0")}</span>
                    <span className="mx-1 text-ink-muted/40">/</span>
                    <span className="text-ink-soft tabular-nums">{String(total).padStart(2, "0")}</span>
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
                        onClear={() => resetPage(() => setActiveCategory(null))}
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
                    <SearchField
                        value={query}
                        onChange={(val) => resetPage(() => setQuery(val))}
                        inputRef={searchRef}
                        ariaLabel={scope === "favorites" ? "Search favorites" : "Search projects"}
                        placeholder={scope === "favorites" ? "Search favorites…" : "Search projects…"}
                    />
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
                    label="NO MATCH"
                    title="No matching projects"
                    description="No projects match the current filters. Try a different search or clear the active filters."
                    action={
                        <Button variant="secondary" size="sm" onClick={clearAll}>
                            Clear filters
                        </Button>
                    }
                />
            ) : viewMode === "grid" ? (
                <ProjectGrid projects={pageProjects} onOpenDetails={setDetailsProject} onSelectTech={(tech) => resetPage(() => setActiveTech(tech))} />
            ) : (
                <ProjectList projects={pageProjects} onOpenDetails={setDetailsProject} onSelectTech={(tech) => resetPage(() => setActiveTech(tech))} />
            )}

            <Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />

            <ProjectDetails
                project={detailsProject}
                onClose={() => setDetailsProject(null)}
                onSelectTech={(tech) => {
                    setDetailsProject(null);
                    resetPage(() => setActiveTech(tech));
                }}
            />
        </div>
    );
}

function ExplorerSkeleton({ viewMode }: { viewMode: ViewMode }) {
    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-[2px] border border-line bg-panel px-3 py-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="ml-auto h-7 w-32" />
                <Skeleton className="h-7 w-24" />
            </div>

            {viewMode === "grid" ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-3">
                    {Array.from({ length: 12 }).map((_, index) => (
                        <div key={index} className="flex min-h-40 flex-col rounded-[2px] border border-line bg-panel p-3.5">
                            <div className="flex items-start gap-3">
                                <Skeleton className="size-8 shrink-0" />
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-32" />
                                    <Skeleton className="h-2.5 w-40" />
                                </div>
                            </div>
                            <div className="mt-auto space-y-2 border-t border-line-soft pt-3">
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-2 w-14" />
                                    <Skeleton className="h-2 w-16" />
                                </div>
                                <div className="flex gap-1.5">
                                    <Skeleton className="h-4 w-14" />
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-4 w-12" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-hidden rounded-[2px] border border-line bg-panel">
                    <div className="border-b border-line bg-panel-inset px-3 py-2">
                        <Skeleton className="h-2.5 w-24" />
                    </div>
                    <div className="divide-y divide-line-soft">
                        {Array.from({ length: 12 }).map((_, index) => (
                            <div key={index} className="flex items-center gap-3 px-3 py-2.5">
                                <Skeleton className="size-6 shrink-0" />
                                <Skeleton className="h-3.5 w-40" />
                                <Skeleton className="ml-auto hidden h-4 w-24 md:block" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
