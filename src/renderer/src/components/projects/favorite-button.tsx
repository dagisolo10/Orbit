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
                "inline-flex items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                size === "md" ? "size-7" : "size-6",
                favorite ? "text-amber-300" : "text-muted-foreground hover:text-foreground",
                className,
            )}
        >
            <Star className={size === "md" ? "size-4" : "size-3.5"} strokeWidth={1.9} fill={favorite ? "currentColor" : "none"} />
        </button>
    );
}
