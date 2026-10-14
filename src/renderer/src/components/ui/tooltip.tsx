import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type TooltipSide = "top" | "bottom" | "right";

type Coords = { top: number; left: number; transform: string };

const GAP = 8;

/**
 * Positioned in viewport space so the tooltip can be portalled to `document.body`
 * and never clipped by a scroll container or `overflow-hidden` ancestor.
 */
function place(side: TooltipSide, rect: DOMRect): Coords {
    switch (side) {
        case "bottom":
            return { top: rect.bottom + GAP, left: rect.left + rect.width / 2, transform: "translateX(-50%)" };
        case "right":
            return { top: rect.top + rect.height / 2, left: rect.right + GAP, transform: "translateY(-50%)" };
        default:
            return { top: rect.top - GAP, left: rect.left + rect.width / 2, transform: "translate(-50%, -100%)" };
    }
}

export function Tooltip({ label, side = "top", children, className }: { label: ReactNode; side?: TooltipSide; children: ReactNode; className?: string }) {
    const triggerRef = useRef<HTMLSpanElement>(null);
    const [coords, setCoords] = useState<Coords | null>(null);

    const show = useCallback(() => {
        const element = triggerRef.current;
        if (!element) return;
        setCoords(place(side, element.getBoundingClientRect()));
    }, [side]);

    const hide = useCallback(() => setCoords(null), []);

    useEffect(() => {
        if (!coords) return;
        const onScroll = () => hide();
        window.addEventListener("scroll", onScroll, true);
        window.addEventListener("resize", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", onScroll);
        };
    }, [coords, hide]);

    return (
        <span ref={triggerRef} className={cn("group/tooltip relative inline-flex", className)} onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
            {children}
            {coords
                ? createPortal(
                      <span
                          role="tooltip"
                          style={{ top: coords.top, left: coords.left, transform: coords.transform }}
                          className="animate-in fade-in-0 pointer-events-none fixed z-70 w-max max-w-[16rem] rounded-md border border-white/10 bg-popover px-2 py-1 text-xs font-medium text-popover-foreground shadow-xl"
                      >
                          {label}
                      </span>,
                      document.body,
                  )
                : null}
        </span>
    );
}
