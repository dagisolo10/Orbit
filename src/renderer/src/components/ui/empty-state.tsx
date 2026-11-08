import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
    icon: Icon,
    label = "NO DATA",
    title,
    description,
    action,
    className,
}: {
    icon?: LucideIcon;
    label?: string;
    title: string;
    description?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div className={cn("relative overflow-hidden rounded-[2px] border border-line bg-panel", className)}>
            <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-30" />
            <div aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-accent/70" />
            <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-start sm:p-8">
                {Icon ? (
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-line bg-panel-inset text-ink-muted">
                        <Icon className="size-4.5" strokeWidth={1.5} />
                    </span>
                ) : null}
                <div className="min-w-0 flex-1">
                    <p className="label-mono text-ink-muted">
                        <span className="text-accent">{"//"}</span> {label}
                    </p>
                    <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-ink">{title}</h3>
                    {description ? <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-soft">{description}</p> : null}
                    {action ? <div className="mt-5 flex flex-wrap items-center gap-2">{action}</div> : null}
                </div>
            </div>
        </div>
    );
}
