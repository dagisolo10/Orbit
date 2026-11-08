import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <kbd
            className={cn(
                "inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[2px] border border-line bg-panel-inset px-1 font-mono text-[10px] leading-none font-medium tracking-[0.04em] text-ink-muted",
                className,
            )}
        >
            {children}
        </kbd>
    );
}
