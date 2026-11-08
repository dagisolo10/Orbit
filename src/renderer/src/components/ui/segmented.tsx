import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type SegmentedOption<T extends string> = {
    value: T;
    label: string;
    icon: LucideIcon;
};

export function Segmented<T extends string>({ options, value, onChange, className }: { options: SegmentedOption<T>[]; value: T; onChange: (value: T) => void; className?: string }) {
    return (
        <div role="tablist" aria-label="View mode" className={cn("inline-flex items-center rounded-[2px] border border-line bg-panel-inset p-0.5", className)}>
            {options.map((option) => {
                const Icon = option.icon;
                const active = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        aria-label={option.label}
                        title={option.label}
                        onClick={() => onChange(option.value)}
                        className={cn(
                            "inline-flex h-6 items-center gap-1.5 rounded-[1px] px-2 font-mono text-[10px] font-medium tracking-[0.08em] uppercase outline-none transition-colors focus-visible:ring-1 focus-visible:ring-accent",
                            active ? "bg-panel-raised text-ink shadow-[inset_0_-1px_0_0_var(--accent)]" : "text-ink-muted hover:text-ink",
                        )}
                    >
                        <Icon className="size-3" strokeWidth={1.9} />
                        <span className="hidden lg:inline">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
