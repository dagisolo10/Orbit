import { getMonogram, hueFromString } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Monogram({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
    const hue = hueFromString(name);
    const dimensions = size === "lg" ? "size-11 text-base" : size === "sm" ? "size-7 text-[11px]" : "size-9 text-xs";

    return (
        <span
            aria-hidden
            className={cn("inline-flex shrink-0 items-center justify-center rounded-lg font-semibold ring-1 ring-inset ring-white/10", dimensions, className)}
            style={{ backgroundColor: `hsl(${hue} 32% 22%)`, color: `hsl(${hue} 68% 80%)` }}
        >
            {getMonogram(name)}
        </span>
    );
}
