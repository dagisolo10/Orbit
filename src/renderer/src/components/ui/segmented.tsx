import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export type SegmentedOption<T extends string> = {
    value: T;
    label: string;
    icon: LucideIcon;
};

export function Segmented<T extends string>({ options, value, onChange, className }: { options: SegmentedOption<T>[]; value: T; onChange: (value: T) => void; className?: string }) {
    return (
        <div role="tablist" className={cn("inline-flex items-center rounded-lg border border-white/8 bg-white/3 p-0.5", className)}>
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
                            "inline-flex items-center gap-1.5 rounded-2xl px-2 py-1 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                            active ? "bg-white/10 text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                        )}
                    >
                        <Icon className="size-3.5" strokeWidth={1.9} />
                        <span className="hidden lg:inline">{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}
