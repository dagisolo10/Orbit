import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-[2px] border font-medium outline-none transition-[background-color,border-color,color,transform] duration-150 ease-[var(--ease-orbit)] focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-40 active:translate-y-px",
    {
        variants: {
            variant: {
                primary: "border-accent bg-accent text-accent-ink shadow-[inset_0_1px_0_0_rgba(255,255,255,0.18)] hover:bg-[#ff5a64] hover:border-[#ff5a64]",
                secondary: "border-line bg-panel-raised text-ink hover:border-line-strong hover:bg-[#1c2024]",
                outline: "border-line bg-transparent text-ink hover:border-line-strong hover:bg-panel-raised",
                ghost: "border-transparent bg-transparent text-ink-soft hover:bg-panel-raised hover:text-ink",
                subtle: "border-line-soft bg-panel-inset text-ink-soft hover:border-line hover:text-ink",
                danger: "border-danger/40 bg-danger/10 text-danger hover:border-danger/70 hover:bg-danger/16",
            },
            size: {
                xs: "h-6 px-2 text-[10px] tracking-[0.08em] uppercase",
                sm: "h-7 px-2.5 text-[11px]",
                md: "h-8 px-3 text-xs",
                lg: "h-9 px-4 text-[13px]",
            },
        },
        defaultVariants: { variant: "secondary", size: "md" },
    },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>;

export function Button({ className, variant, size, type = "button", ...props }: ButtonProps) {
    return <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
