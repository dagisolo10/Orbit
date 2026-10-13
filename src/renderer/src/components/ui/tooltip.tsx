import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type TooltipSide = "top" | "bottom" | "right";

const SIDE_CLASS: Record<TooltipSide, string> = {
    top: "bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2",
    bottom: "top-[calc(100%+8px)] left-1/2 -translate-x-1/2",
    right: "left-[calc(100%+10px)] top-1/2 -translate-y-1/2",
};

export function Tooltip({ label, side = "top", children, className }: { label: ReactNode; side?: TooltipSide; children: ReactNode; className?: string }) {
    return (
        <span className={cn("group/tooltip relative inline-flex", className)}>
            {children}
            <span
                role="tooltip"
                className={cn(
                    "pointer-events-none absolute z-70 w-max max-w-[16rem] rounded-md border border-white/10 bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-xl transition-opacity duration-150 delay-150 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100",
                    SIDE_CLASS[side],
                )}
            >
                {label}
            </span>
        </span>
    );
}
