import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Modal({
    open,
    onClose,
    title,
    description,
    children,
    footer,
    className,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: ReactNode;
    children: ReactNode;
    footer?: ReactNode;
    className?: string;
}) {
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-95 flex items-start justify-center overflow-y-auto p-6 sm:items-center">
            <div className="animate-in fade-in-0 fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden />
            <div
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className={cn(
                    "animate-in fade-in-0 zoom-in-95 relative z-10 my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-popover shadow-2xl shadow-black/60",
                    className,
                )}
            >
                <div className="flex items-start justify-between gap-4 border-b border-white/8 px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
                        {description ? <div className="mt-0.5 text-xs text-muted-foreground">{description}</div> : null}
                    </div>
                    <IconButton icon={X} label="Close" size="sm" onClick={onClose} />
                </div>
                <div className="px-5 py-4">{children}</div>
                {footer ? <div className="flex items-center justify-end gap-2 border-t border-white/8 bg-white/1.5 px-5 py-3">{footer}</div> : null}
            </div>
        </div>,
        document.body,
    );
}
