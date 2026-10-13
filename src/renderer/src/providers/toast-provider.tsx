import { ToastContext, type ToastInput, type ToastRecord, type ToastTone } from "@/contexts/toast-context";
import { cn } from "@/lib/utils";
import { CircleAlert, CircleCheck, Info, X, type LucideIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";

const TONE_ICON: Record<ToastTone, LucideIcon> = {
    info: Info,
    success: CircleCheck,
    error: CircleAlert,
};

const TONE_COLOR: Record<ToastTone, string> = {
    info: "text-primary",
    success: "text-emerald-400",
    error: "text-red-400",
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastRecord[]>([]);
    const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

    const dismiss = useCallback((id: string) => {
        setToasts((previous) => previous.filter((item) => item.id !== id));
        const timer = timers.current.get(id);
        if (timer) {
            clearTimeout(timer);
            timers.current.delete(id);
        }
    }, []);

    const toast = useCallback(
        (input: ToastInput) => {
            const id = crypto.randomUUID();
            const tone = input.tone ?? "info";
            setToasts((previous) => [...previous.slice(-2), { ...input, tone, id }]);
            timers.current.set(
                id,
                setTimeout(() => dismiss(id), 4600),
            );
        },
        [dismiss],
    );

    const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="pointer-events-none fixed right-4 bottom-4 z-100 flex w-88 max-w-[calc(100vw-2rem)] flex-col gap-2">
                {toasts.map((item) => {
                    const Icon = TONE_ICON[item.tone];
                    return (
                        <div
                            key={item.id}
                            className="animate-in fade-in slide-in-from-bottom-2 pointer-events-auto flex items-start gap-3 rounded-xl border border-white/10 bg-popover/95 p-3 shadow-2xl backdrop-blur-md"
                        >
                            <Icon className={cn("mt-0.5 size-4 shrink-0", TONE_COLOR[item.tone])} strokeWidth={2} />
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-medium text-foreground">{item.title}</p>
                                {item.description ? <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.description}</p> : null}
                            </div>
                            <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss notification" className="text-muted-foreground transition-colors hover:text-foreground">
                                <X className="size-3.5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
