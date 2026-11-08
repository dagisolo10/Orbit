import { cn } from "@/lib/utils";

/**
 * A segmented readout bar. Discrete cells read as instrumentation rather than
 * a smooth progress bar, which fits Orbit's telemetry-inspired language.
 */
export function DataBar({ value, segments = 16, className, tone = "accent" }: { value: number; segments?: number; className?: string; tone?: "accent" | "muted" }) {
    const ratio = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
    const filled = ratio > 0 ? Math.max(1, Math.round(ratio * segments)) : 0;

    return (
        <span aria-hidden className={cn("flex w-full items-center gap-0.5", className)}>
            {Array.from({ length: segments }).map((_, index) => (
                <span key={index} className={cn("h-1.5 flex-1 rounded-[0.5px] transition-colors", index < filled ? (tone === "accent" ? "bg-accent/80" : "bg-ink-soft/60") : "bg-line-soft")} />
            ))}
        </span>
    );
}
