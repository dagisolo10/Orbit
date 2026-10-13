import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({ icon: Icon, title, description, action, className }: { icon?: LucideIcon; title: string; description?: ReactNode; action?: ReactNode; className?: string }) {
    return (
        <div className={cn("flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/8 bg-white/1.5 px-6 py-12 text-center", className)}>
            {Icon ? (
                <span className="mb-4 inline-flex size-11 items-center justify-center rounded-xl border border-white/8 bg-white/3 text-muted-foreground">
                    <Icon className="size-5" strokeWidth={1.6} />
                </span>
            ) : null}
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            {description ? <p className="mt-1.5 max-w-md text-[13px] leading-relaxed text-muted-foreground">{description}</p> : null}
            {action ? <div className="mt-5 flex items-center gap-2">{action}</div> : null}
        </div>
    );
}
