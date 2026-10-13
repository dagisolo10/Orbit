import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SettingSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-white/8 bg-white/1.5">
            <div className="border-b border-white/6 px-4 py-3">
                <h2 className="text-sm font-semibold text-foreground">{title}</h2>
                {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
            </div>
            <div className="divide-y divide-white/6">{children}</div>
        </section>
    );
}

export function SettingRow({ icon: Icon, label, value, mono, badge, action }: { icon: LucideIcon; label: string; value: ReactNode; mono?: boolean; badge?: ReactNode; action?: ReactNode }) {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/3 text-muted-foreground">
                <Icon className="size-4" strokeWidth={1.85} />
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-foreground">{label}</p>
                <p className={cn("truncate text-xs text-muted-foreground", mono && "font-mono")} title={typeof value === "string" ? value : undefined}>
                    {value}
                </p>
            </div>
            {badge ? <div className="shrink-0">{badge}</div> : null}
            {action ? <div className="shrink-0">{action}</div> : null}
        </div>
    );
}
