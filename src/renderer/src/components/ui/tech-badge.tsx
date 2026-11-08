import { TechIcon } from "@/components/ui/tech-icon";
import { getTechLabel } from "@/lib/tech";
import { cn } from "@/lib/utils";
import type { Technology } from "@/types/project";

/**
 * A compact technical label with the technology's brand mark. Icons carry
 * recognition; the surrounding hairline keeps stacks scannable without loud
 * coloured pills.
 */
export function TechBadge({ technology, onClick, className }: { technology: Technology; onClick?: () => void; className?: string }) {
    const label = getTechLabel(technology.name);
    const classes = cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-[2px] border border-line-soft bg-panel-inset px-1.5 py-[3px] font-mono text-[10px] leading-none text-ink-soft transition-colors",
        onClick && "cursor-pointer hover:border-line-strong hover:text-ink focus-visible:border-accent",
        className,
    );

    const content = (
        <>
            <TechIcon name={technology.name} className="size-3.5" />
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
