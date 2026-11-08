import { getMonogram, hueFromString } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

export function Monogram({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
    const hue = hueFromString(name);
    const dimensions = size === "lg" ? "size-10 text-[13px]" : size === "sm" ? "size-6 text-[9px]" : "size-8 text-[11px]";

    const style: CSSProperties = {
        backgroundColor: `hsl(${hue} 22% 13%)`,
        color: `hsl(${hue} 38% 74%)`,
        borderColor: `hsl(${hue} 24% 24%)`,
        borderLeftColor: `hsl(${hue} 42% 48%)`,
    };

    return (
        <span
            aria-hidden
            style={style}
            className={cn("inline-flex shrink-0 items-center justify-center rounded-[2px] border border-l-2 font-mono font-semibold tracking-[0.02em] uppercase", dimensions, className)}
        >
            {getMonogram(name)}
        </span>
    );
}
