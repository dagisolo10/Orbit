import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, pageCount, onPageChange, className }: { page: number; pageCount: number; onPageChange: (page: number) => void; className?: string }) {
    if (pageCount <= 1) return null;

    return (
        <div className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3", className)}>
            <p className="label-mono text-ink-muted">
                PAGE <span className="text-ink">{String(page).padStart(2, "0")}</span> / {String(pageCount).padStart(2, "0")}
            </p>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    aria-label="Previous page"
                    disabled={page <= 1}
                    onClick={() => onPageChange(page - 1)}
                    className="inline-flex size-7 items-center justify-center rounded-[2px] border border-line bg-panel text-ink-soft outline-none transition-colors hover:border-line-strong hover:text-ink focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-30"
                >
                    <ChevronLeft className="size-3.5" />
                </button>

                {getPageItems(page, pageCount).map((item, index) =>
                    item === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="px-1 font-mono text-[10px] text-ink-muted" aria-hidden>
                            …
                        </span>
                    ) : (
                        <button
                            key={item}
                            type="button"
                            onClick={() => onPageChange(item)}
                            aria-current={item === page ? "page" : undefined}
                            aria-label={`Page ${item}`}
                            className={cn(
                                "inline-flex size-7 items-center justify-center rounded-[2px] border font-mono text-[10px] font-medium tabular-nums outline-none transition-colors focus-visible:ring-1 focus-visible:ring-accent",
                                item === page ? "border-accent bg-accent text-(--accent-ink)" : "border-line bg-panel text-ink-muted hover:border-line-strong hover:text-ink",
                            )}
                        >
                            {String(item).padStart(2, "0")}
                        </button>
                    ),
                )}

                <button
                    type="button"
                    aria-label="Next page"
                    disabled={page >= pageCount}
                    onClick={() => onPageChange(page + 1)}
                    className="inline-flex size-7 items-center justify-center rounded-[2px] border border-line bg-panel text-ink-soft outline-none transition-colors hover:border-line-strong hover:text-ink focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-30"
                >
                    <ChevronRight className="size-3.5" />
                </button>
            </div>
        </div>
    );
}

function getPageItems(page: number, pageCount: number): (number | "ellipsis")[] {
    const visible = new Set<number>([1, page - 1, page, page + 1, pageCount]);
    const sorted = [...visible].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);

    const items: (number | "ellipsis")[] = [];
    let previous = 0;

    for (const value of sorted) {
        if (previous !== 0 && value - previous > 1) items.push("ellipsis");
        items.push(value);
        previous = value;
    }

    return items;
}
