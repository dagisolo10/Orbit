import { TechIcon } from "@/components/ui/tech-icon";
import { getCategoryMeta, getTechLabel } from "@/lib/tech";
import { cn } from "@/lib/utils";
import type { Technology } from "@/types/project";

export function TechBadge({ technology, onClick, className }: { technology: Technology; onClick?: () => void; className?: string }) {
    const label = getTechLabel(technology.name);
    const meta = getCategoryMeta(technology.category);
    const classes = cn(
        "inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        meta.className,
        onClick && "cursor-pointer transition-transform hover:scale-[1.04]",
        className,
    );

    const content = (
        <>
            <TechIcon name={technology.name} className="size-3" />
            <span className="truncate">{label}</span>
        </>
    );

    if (onClick) {
        return (
            <button type="button" onClick={onClick} className={classes} title={`Filter by ${label}`}>
                {content}
            </button>
        );
    }

    return (
        <span className={classes} title={label}>
            {content}
        </span>
    );
}
