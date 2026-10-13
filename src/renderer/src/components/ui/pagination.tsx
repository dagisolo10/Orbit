import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, pageCount, onPageChange, className }: { page: number; pageCount: number; onPageChange: (page: number) => void; className?: string }) {
    if (pageCount <= 1) return null;

    return (
        <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
            <p className="text-xs text-muted-foreground">
                Page <span className="font-medium text-foreground">{page}</span> of {pageCount}
            </p>

            <div className="flex items-center gap-1">
                <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
                    <ChevronLeft className="size-3.5" />
                    <span className="hidden sm:inline">Previous</span>
                </Button>

                {getPageItems(page, pageCount).map((item, index) =>
                    item === "ellipsis" ? (
                        <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-muted-foreground" aria-hidden>
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
                                "inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium tabular-nums outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                                item === page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-white/8 hover:text-foreground",
                            )}
                        >
                            {item}
                        </button>
                    ),
                )}

                <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>
                    <span className="hidden sm:inline">Next</span>
                    <ChevronRight className="size-3.5" />
                </Button>
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
