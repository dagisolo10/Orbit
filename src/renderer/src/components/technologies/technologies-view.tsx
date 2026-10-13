import { ScanErrorBanner, ScannerOfflineState } from "@/components/common/scanner-offline-state";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { TechIcon } from "@/components/ui/tech-icon";
import { useOrbit } from "@/contexts/orbit-context";
import { pluralize } from "@/lib/format";
import { CATEGORY_ORDER, getCategoryMeta, getTechLabel } from "@/lib/tech";
import { cn } from "@/lib/utils";
import type { Technology, TechnologyCategory } from "@/types/project";
import { Braces, Database, Layers, LayoutPanelLeft, Palette, SearchX, Server, Wrench, type LucideIcon } from "lucide-react";
import { useMemo } from "react";

const CATEGORY_ICONS: Record<TechnologyCategory, LucideIcon> = {
    language: Braces,
    frontend: LayoutPanelLeft,
    backend: Server,
    styling: Palette,
    "database-orm": Database,
    tools: Wrench,
};

export function TechnologiesView({ onSelectTech, onSelectCategory }: { onSelectTech: (technology: Technology) => void; onSelectCategory: (category: TechnologyCategory) => void }) {
    const { status, error, reload, reScan, dismissError, technologies, projects, query } = useOrbit();
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

    if (status === "loading") return <TechSkeleton />;
    if (status === "error" && error) return <ScannerOfflineState error={error} onRetry={reload} />;

    if (technologies.length === 0) {
        return (
            <EmptyState
                icon={Layers}
                title="No technologies detected"
                description="Orbit reads dependencies from each project's package.json. Once projects are available, the technologies you work with will be grouped by category here."
            />
        );
    }

    return (
        <div className="space-y-6">
            {error ? <ScanErrorBanner error={error} onRetry={reScan} onDismiss={dismissError} /> : null}

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <p className="text-[13px] text-muted-foreground">
                    <span className="font-medium text-foreground">{technologies.length}</span> technologies across{" "}
                    <span className="font-medium text-foreground">{pluralize(projects.length, "project")}</span>
                </p>
                {query.trim() ? <span className="text-xs text-muted-foreground">Filtered by “{query.trim()}”</span> : null}
                <span className="ml-auto text-xs text-muted-foreground">Detected from package.json dependencies</span>
            </div>

            {groups.length === 0 ? (
                <EmptyState icon={SearchX} title="No matching technologies" description={`No detected technology matches “${query.trim()}”.`} />
            ) : (
                groups.map((group) => {
                    const meta = getCategoryMeta(group.category);
                    const Icon = CATEGORY_ICONS[group.category];
                    return (
                        <section key={group.category} className="space-y-3">
                            <div className="flex items-center gap-2.5">
                                <span className={cn("flex size-6 items-center justify-center rounded-md ring-1 ring-inset", meta.className)}>
                                    <Icon className="size-3.5" />
                                </span>
                                <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
                                <span className="text-xs tabular-nums text-muted-foreground">{group.items.length}</span>
                                <button
                                    type="button"
                                    onClick={() => onSelectCategory(group.category)}
                                    className="ml-auto text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                                >
                                    Filter projects
                                </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {group.items.map((item) => (
                                    <button
                                        key={item.name}
                                        type="button"
                                        onClick={() => onSelectTech(item)}
                                        className="group flex flex-col gap-3 rounded-xl border border-white/8 bg-card p-4 text-left outline-none transition-all hover:border-white/14 hover:bg-white/[0.035] focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/3">
                                                <TechIcon name={item.name} className="size-5" />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[13px] font-medium text-foreground">{getTechLabel(item.name)}</p>
                                                <p className="text-[11px] tabular-nums text-muted-foreground">{pluralize(item.count, "project")}</p>
                                            </div>
                                        </div>
                                        <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                                            <div className="h-full rounded-full bg-primary/60" style={{ width: `${Math.max(8, Math.round((item.count / maxCount) * 100))}%` }} />
                                        </div>
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

function TechSkeleton() {
    return (
        <div className="space-y-5">
            <Skeleton className="h-4 w-56" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-24" />
                ))}
            </div>
        </div>
    );
}
