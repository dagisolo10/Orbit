import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function SettingSection({ id, description, children }: { id?: string; description?: string; children: ReactNode }) {
    return (
        <section id={id} className="scroll-mt-4">
            {description ? <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-ink-soft">{description}</p> : null}
            <div className="mt-3 divide-y divide-line-soft border-y border-line">{children}</div>
        </section>
    );
}

export function SettingRow({ icon: Icon, label, value, mono, badge, action }: { icon: LucideIcon; label: string; value: ReactNode; mono?: boolean; badge?: ReactNode; action?: ReactNode }) {
    return (
        <div className="grid grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 py-3">
            <Icon className="size-3.5 text-ink-muted" strokeWidth={1.75} />
            <div className="min-w-0">
                <p className="text-[12px] font-medium text-ink">{label}</p>
                <p className={cn("mt-0.5 truncate text-[11px] text-ink-muted", mono && "font-mono text-[10px]")} title={typeof value === "string" ? value : undefined}>
                    {value}
                </p>
            </div>
            {badge || action ? (
                <div className="flex shrink-0 items-center gap-2">
                    {badge}
                    {action}
                </div>
            ) : null}
        </div>
    );
}
