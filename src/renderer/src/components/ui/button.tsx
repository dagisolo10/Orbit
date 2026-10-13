import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45",
    {
        variants: {
            variant: {
                primary: "bg-primary text-primary-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.14),0_10px_24px_-12px_rgba(124,92,240,0.9)] hover:bg-primary/90",
                secondary: "border border-white/8 bg-white/[0.04] text-foreground hover:bg-white/[0.075]",
                outline: "border border-border bg-transparent text-foreground hover:bg-white/5",
                ghost: "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                subtle: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
                danger: "bg-destructive/90 text-destructive-foreground hover:bg-destructive",
            },
            size: {
                sm: "h-8 px-3 text-xs",
                md: "h-9 px-3.5 text-sm",
                lg: "h-10 px-4 text-sm",
            },
        },
        defaultVariants: { variant: "secondary", size: "md" },
    },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
    return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
