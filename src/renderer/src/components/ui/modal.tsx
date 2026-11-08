import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const EXIT_MS = 150;

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
    const [mounted, setMounted] = useState(open);
    const [closing, setClosing] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const restoreFocus = useRef<HTMLElement | null>(null);
    const titleId = useId();

    useEffect(() => {
        if (open) {
            setMounted(true);
            setClosing(false);
            restoreFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const frame = requestAnimationFrame(() => panelRef.current?.focus());
            return () => cancelAnimationFrame(frame);
        }

        if (!mounted) return;
        setClosing(true);
        const timer = window.setTimeout(() => {
            setMounted(false);
            setClosing(false);
            restoreFocus.current?.focus?.();
        }, EXIT_MS);
        return () => window.clearTimeout(timer);
    }, [open, mounted]);

    useEffect(() => {
        if (!mounted) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
                return;
            }

            if (event.key !== "Tab") return;
            const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            );
            if (!focusables || focusables.length === 0) return;

            const first = focusables[0];
            const last = focusables[focusables.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", onKeyDown);
        return () => document.removeEventListener("keydown", onKeyDown);
    }, [mounted, onClose]);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-95 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6">
            <div aria-hidden onClick={onClose} className={cn("fixed inset-0 bg-black/70 backdrop-blur-[2px]", closing ? "animate-out fade-out-0 duration-150" : "animate-in fade-in-0 duration-200")} />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                className={cn(
                    "relative z-10 my-auto w-full max-w-lg overflow-hidden rounded-[2px] border border-line-strong bg-panel shadow-[0_32px_80px_-24px_rgba(0,0,0,0.95)] outline-none",
                    closing ? "animate-out fade-out-0 zoom-out-[0.99] duration-150" : "animate-in fade-in-0 zoom-in-[0.985] slide-in-from-bottom-1 duration-200",
                    className,
                )}
            >
                <div aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-linear-to-r from-accent via-accent/40 to-transparent" />

                <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
                    <div className="min-w-0">
                        <h2 id={titleId} className="mt-1.5 truncate text-[15px] font-semibold tracking-tight text-ink">
                            {title}
                        </h2>
                        {description ? <div className="mt-1 text-xs leading-relaxed text-ink-soft">{description}</div> : null}
                    </div>
                    <IconButton icon={X} label="Close" size="sm" onClick={onClose} />
                </div>

                <div className="px-5 py-4">{children}</div>

                {footer ? <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-panel-inset px-5 py-3">{footer}</div> : null}
            </div>
        </div>,
        document.body,
    );
}
