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
            <Button aria-label={label} variant="ghost" className={cn(size === "md" ? "size-9 px-0" : "size-8 px-0", active && "bg-white/8 text-foreground", className)} {...props}>
                <Icon className={size === "md" ? "size-4.5" : "size-4"} strokeWidth={1.75} />
            </Button>
        </Tooltip>
    );
}
