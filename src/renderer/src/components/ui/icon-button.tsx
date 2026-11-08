import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
    icon: LucideIcon;
    label: string;
    side?: "top" | "bottom" | "right";
    size?: "sm" | "md";
    active?: boolean;
};

export function IconButton({ icon: Icon, label, side = "top", size = "md", active = false, className, ...props }: IconButtonProps) {
    return (
        <Tooltip label={label} side={side}>
            <Button
                aria-label={label}
                variant={active ? "secondary" : "ghost"}
                className={cn(
                    "px-0",
                    size === "md" ? "size-8" : "size-7",
                    active && "border-accent/40 text-ink shadow-[inset_0_-2px_0_0_var(--accent)]",
                    className,
                )}
                {...props}
            >
                <Icon className={size === "md" ? "size-4" : "size-3.5"} strokeWidth={1.75} />
            </Button>
        </Tooltip>
    );
}
