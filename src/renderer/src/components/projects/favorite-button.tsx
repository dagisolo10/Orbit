import { Star } from "lucide-react";

import { cn } from "@/lib/utils";

export function FavoriteButton({ favorite, onToggle, size = "md", className }: { favorite: boolean; onToggle: () => void; size?: "sm" | "md"; className?: string }) {
    return (
        <button
            type="button"
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={favorite}
            onClick={onToggle}
            className={cn(
                "inline-flex items-center justify-center rounded-[1px] outline-none transition-colors focus-visible:ring-1 focus-visible:ring-accent",
                size === "md" ? "size-7" : "size-6",
                favorite ? "text-amber-300 hover:text-amber-200" : "text-ink-muted hover:bg-white/[0.06] hover:text-ink",
                className,
            )}
        >
            <Star className={size === "md" ? "size-3.5" : "size-3"} strokeWidth={1.8} fill={favorite ? "currentColor" : "none"} />
        </button>
    );
}
