import { getTechLabel } from "@/lib/tech";
import { getTechIcon } from "@/lib/tech-icons";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

export function TechIcon({ name, className }: { name: string; className?: string }) {
    const icon = getTechIcon(name);

    if (!icon) {
        return (
            <span
                aria-hidden
                className={cn(
                    "inline-flex size-4 shrink-0 items-center justify-center rounded-[2px] border border-line bg-panel-inset font-mono text-[8px] leading-none font-semibold text-ink-muted",
                    className,
                )}
            >
                {getTechLabel(name).charAt(0).toUpperCase()}
            </span>
        );
    }

    if (icon.kind === "mask") {
        const maskStyle: CSSProperties = {
            backgroundColor: icon.color,
            maskImage: `url("${icon.url}")`,
            WebkitMaskImage: `url("${icon.url}")`,
            maskRepeat: "no-repeat",
            WebkitMaskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskPosition: "center",
            maskSize: "contain",
            WebkitMaskSize: "contain",
        };
        return <span aria-hidden className={cn("inline-block size-4 shrink-0", className)} style={maskStyle} />;
    }

    return <img src={icon.url} alt="" aria-hidden className={cn("size-4 shrink-0 object-contain", icon.adjust, className)} />;
}
