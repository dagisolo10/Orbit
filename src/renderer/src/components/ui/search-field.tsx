import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import type { RefObject } from "react";

/**
 * Search input owned by a single view. Each tab keeps its own term so a search
 * in Projects never leaks into Favorites or Workspaces.
 */
export function SearchField({
    value,
    onChange,
    placeholder,
    ariaLabel,
    inputRef,
    className,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    ariaLabel: string;
    inputRef?: RefObject<HTMLInputElement | null>;
    className?: string;
}) {
    const isMac = typeof window !== "undefined" && window.electron?.process.platform === "darwin";

    return (
        <div className={cn("relative flex w-full items-center sm:w-56 lg:w-96", className)}>
            <Search className="pointer-events-none absolute left-2.5 size-3.5 text-ink-muted" strokeWidth={1.9} />
            <input
                ref={inputRef}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                spellCheck={false}
                aria-label={ariaLabel}
                className="h-7 w-full rounded-[2px] border border-line bg-panel-inset pr-14 pl-8 font-mono text-[11px] text-ink outline-none transition-colors placeholder:text-ink-muted/80 hover:border-line-strong focus:border-accent/70 focus:bg-panel focus:ring-1 focus:ring-accent/30"
            />
            <span className="absolute right-1.5 flex items-center gap-1">
                {value ? (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => onChange("")}
                        className="inline-flex size-4 items-center justify-center rounded-[1px] text-ink-muted transition-colors hover:bg-white/6 hover:text-ink"
                    >
                        <X className="size-3" />
                    </button>
                ) : (
                    <>
                        <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
                        <Kbd>K</Kbd>
                    </>
                )}
            </span>
        </div>
    );
}
