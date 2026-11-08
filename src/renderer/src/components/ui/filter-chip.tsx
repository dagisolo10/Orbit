import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/** Active-filter token shared by the project and workspace explorers. */
export function FilterChip({ label, onClear, className }: { label: ReactNode; onClear: () => void; className?: string }) {
    return (
        <span className={cn("inline-flex items-center gap-1.5 rounded-[2px] border border-line bg-panel-inset py-0.5 pr-0.5 pl-2 text-ink-soft", className)}>
            {label}
            <button
                type="button"
                onClick={onClear}
                aria-label="Clear filter"
                className="inline-flex size-5 items-center justify-center rounded-[1px] text-ink-muted outline-none transition-colors hover:bg-white/[0.06] hover:text-ink focus-visible:ring-1 focus-visible:ring-accent"
            >
                <X className="size-2.5" />
            </button>
        </span>
    );
}
