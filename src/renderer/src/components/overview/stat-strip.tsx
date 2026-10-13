import { Skeleton } from "@/components/ui/skeleton";
import type { LucideIcon } from "lucide-react";

export type StatItem = {
    label: string;
    value: string;
    hint?: string;
    icon: LucideIcon;
};

export function StatStrip({ items, loading = false }: { items: StatItem[]; loading?: boolean }) {
    return (
        <div className="flex flex-col divide-y divide-white/6 overflow-hidden rounded-2xl border border-white/8 bg-white/2 sm:flex-row sm:divide-x sm:divide-y-0">
            {items.map((item) => (
                <div key={item.label} className="flex flex-1 items-center gap-3 p-4">
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-muted-foreground">
                        <item.icon className="size-4" strokeWidth={1.85} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium tracking-wider text-muted-foreground/80 uppercase">{item.label}</p>
                        {loading ? (
                            <div className="mt-1 space-y-1.5">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-2.5 w-28" />
                            </div>
                        ) : (
                            <>
                                <p className="mt-0.5 truncate text-lg font-semibold tabular-nums text-foreground">{item.value}</p>
                                {item.hint ? (
                                    <p className="truncate text-[11px] text-muted-foreground" title={item.hint}>
                                        {item.hint}
                                    </p>
                                ) : null}
                            </>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
