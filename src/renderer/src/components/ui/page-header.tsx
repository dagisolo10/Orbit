import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function PageHeader({
    section,
    index,
    title,
    description,
    actions,
    className,
}: {
    section: string;
    index?: string;
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}) {
    return (
        <header className={cn("animate-rise border-b border-line pb-5", className)}>
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <span className="label-mono text-ink-muted">
                            <span className="text-accent">●</span> ORBIT / {section}
                        </span>
                        {index ? <span className="rounded-[1px] border border-line px-1 py-px font-mono text-[9px] tracking-[0.14em] text-ink-muted">{index}</span> : null}
                    </div>
                    <h1 className="mt-2.5 text-[26px] leading-[1.05] font-semibold tracking-[-0.025em] text-ink">{title}</h1>
                    {description ? <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-ink-soft">{description}</p> : null}
                </div>

                {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
            </div>
        </header>
    );
}
