import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
    return (
        <div className={cn("relative overflow-hidden rounded-[2px] bg-panel-raised", className)} aria-hidden>
            <div className="animate-sweep absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/[0.055] to-transparent" />
        </div>
    );
}
