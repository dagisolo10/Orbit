import { ScanErrorBanner, ScannerOfflineState } from "@/components/common/scanner-offline-state";
import { DataBar } from "@/components/ui/data-bar";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { SearchField } from "@/components/ui/search-field";
import { Skeleton } from "@/components/ui/skeleton";
import { TechIcon } from "@/components/ui/tech-icon";
import { useOrbit } from "@/contexts/orbit-context";
import { useViewSearch } from "@/hooks/use-view-search";
import { pluralize } from "@/lib/format";
import { CATEGORY_ORDER, getCategoryMeta, getTechLabel } from "@/lib/tech";
import { VIEW_META } from "@/types/navigation";
import type { Technology, TechnologyCategory } from "@/types/project";
import { ChevronRight, Layers, SearchX } from "lucide-react";
import { useMemo } from "react";

export function TechnologiesView({ onSelectTech, onSelectCategory }: { onSelectTech: (technology: Technology) => void; onSelectCategory: (category: TechnologyCategory) => void }) {
    const { status, error, reload, reScan, dismissError, technologies, projects } = useOrbit();
    const { query, setQuery, inputRef: searchRef } = useViewSearch("technologies");
    const maxCount = technologies[0]?.count ?? 1;

    const filtered = useMemo(() => {
        const term = query.trim().toLowerCase();
        if (!term) return technologies;
        return technologies.filter((item) => item.name.toLowerCase().includes(term) || getTechLabel(item.name).toLowerCase().includes(term));
    }, [technologies, query]);

    const groups = useMemo(
        () =>
            CATEGORY_ORDER.map((category) => ({
                category,
                items: filtered.filter((item) => item.category === category).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
            })).filter((group) => group.items.length > 0),
        [filtered],
    );

    const categoryCount = useMemo(() => new Set(technologies.map((item) => item.category)).size, [technologies]);
    const meta = VIEW_META.technologies;

    const header = (
        <PageHeader
            section={meta.section}
            index={meta.index}
            title={meta.title}
            description={meta.subtitle}
            actions={
                <SearchField
                    inputRef={searchRef}
                    value={query}
                    onChange={setQuery}
                    placeholder="Search technologies…"
                    ariaLabel="Search technologies"
                />
            }
        />
    );

    if (status === "loading") {
        return (
            <div className="space-y-5">
                {header}
                <TechSkeleton />
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

    if (technologies.length === 0) {
        return (
            <div className="space-y-5">
                {header}
                <EmptyState
                    icon={Layers}
                    label="STACK EMPTY"
                    title="No technologies detected"
                    description="Orbit reads dependencies from each project's package.json. Once projects are available, the technologies you work with will be grouped by category here."
                />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {header}

            {error ? <ScanErrorBanner error={error} onRetry={reScan} onDismiss={dismissError} /> : null}

            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[2px] border border-line bg-line">
                <Readout label="TECHNOLOGIES" value={technologies.length} hint="Detected packages" />
                <Readout label="CATEGORIES" value={categoryCount} hint="Distinct roles" />
                <Readout label="PROJECTS" value={projects.length} hint="Source manifests" />
            </div>

            {groups.length === 0 ? (
                <EmptyState icon={SearchX} label="NO MATCH" title="No matching technologies" description={`No detected technology matches “${query.trim()}”.`} />
            ) : (
                groups.map((group) => {
                    const category = getCategoryMeta(group.category);
                    return (
                        <section key={group.category} className="overflow-hidden rounded-[2px] border border-line bg-panel">
                            <div className="flex items-center justify-between gap-3 border-b border-line px-3 py-2">
                                <div className="flex min-w-0 items-center gap-2">
                                    <h3 className="truncate text-[12px] font-medium text-ink">{category.label}</h3>
                                    <span className="font-mono text-[9px] tracking-[0.12em] text-ink-muted/70">{category.short}</span>
                                    <span className="font-mono text-[9px] tabular-nums text-ink-muted/60">{String(group.items.length).padStart(2, "0")}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectCategory(group.category)}
                                    className="inline-flex shrink-0 items-center gap-1 font-mono text-[9px] tracking-[0.08em] text-ink-muted uppercase outline-none transition-colors hover:text-ink focus-visible:ring-1 focus-visible:ring-accent"
                                >
                                    Filter projects
                                    <ChevronRight className="size-3" />
                                </button>
                            </div>

                            <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
                                {group.items.map((item) => (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => onSelectTech(item)}
                                        className="group flex flex-col gap-2.5 bg-panel p-3 text-left outline-none transition-colors hover:bg-panel-raised focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset"
                                    >
                                        <span className="flex min-w-0 items-center gap-2.5">
                                            <span className="flex size-7 shrink-0 items-center justify-center rounded-[1px] border border-line bg-panel-inset">
                                                <TechIcon name={item.name} className="size-4" />
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="block truncate text-[12px] font-medium text-ink">{getTechLabel(item.name)}</span>
                                                <span className="block truncate font-mono text-[9px] text-ink-muted" title={item.name}>
                                                    {item.name}
                                                </span>
                                            </span>
                                            <span className="shrink-0 font-mono text-[10px] tabular-nums text-ink-soft">{String(item.count).padStart(2, "0")}</span>
                                        </span>

                                        <DataBar value={item.count / maxCount} segments={20} />

                                        <span className="flex items-center justify-between font-mono text-[9px] tracking-[0.06em] text-ink-muted uppercase">
                                            <span>{pluralize(item.count, "project")}</span>
                                            <span className="text-ink-muted/50">{category.short}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </section>
                    );
                })
            )}
        </div>
    );
}

function Readout({ label, value, hint }: { label: string; value: number; hint: string }) {
    return (
        <div className="min-w-0 bg-panel px-4 py-3">
            <p className="label-mono text-ink-muted">{label}</p>
            <p className="mt-1.5 font-mono text-[22px] leading-none tracking-tight text-ink tabular-nums">{String(value).padStart(2, "0")}</p>
            <p className="mt-1.5 truncate font-mono text-[9px] text-ink-muted">{hint}</p>
        </div>
    );
}

function TechSkeleton() {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-px overflow-hidden rounded-[2px] border border-line bg-line">
                {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="bg-panel px-4 py-3">
                        <Skeleton className="h-2.5 w-20" />
                        <Skeleton className="mt-2 h-6 w-10" />
                        <Skeleton className="mt-2 h-2.5 w-24" />
                    </div>
                ))}
            </div>
            {Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="overflow-hidden rounded-[2px] border border-line bg-panel">
                    <div className="border-b border-line px-3 py-2">
                        <Skeleton className="h-3 w-32" />
                    </div>
                    <div className="grid gap-px bg-line sm:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, cellIndex) => (
                            <div key={cellIndex} className="bg-panel p-3">
                                <Skeleton className="h-7 w-full" />
                                <Skeleton className="mt-3 h-1.5 w-full" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
