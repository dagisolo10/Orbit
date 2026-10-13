import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <kbd
            className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded border border-white/10 bg-white/5 px-1.5 font-sans text-[11px] font-medium leading-none text-muted-foreground",
                className,
            )}
        >
            {children}
        </kbd>
    );
}
