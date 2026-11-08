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
    info: "text-accent",
    error: "text-danger",
    success: "text-ok",
};

const TONE_BORDER: Record<ToastTone, string> = {
    info: "border-l-accent",
    error: "border-l-danger",
    success: "border-l-ok",
};

const TONE_LABEL: Record<ToastTone, string> = {
    info: "NOTICE",
    error: "ERROR",
    success: "OK",
};

function timestamp(at: number): string {
    return new Date(at).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

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
            setToasts((previous) => [...previous.slice(-2), { ...input, tone, id, at: Date.now() }]);
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
            <div
                className="pointer-events-none fixed bottom-4 z-100 flex flex-col gap-2"
                style={{
                    left: "calc(var(--sidebar-width, 0px) + 1rem)",
                    width: "min(22rem, calc(100vw - var(--sidebar-width, 0px) - 2rem))",
                }}
            >
                {toasts.map((item) => {
                    const Icon = TONE_ICON[item.tone];
                    return (
                        <div
                            key={item.id}
                            className={cn(
                                "animate-in fade-in slide-in-from-left-2 pointer-events-auto overflow-hidden rounded-[2px] border border-line border-l-2 bg-panel-raised/98 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.95)] backdrop-blur-md duration-200",
                                TONE_BORDER[item.tone],
                            )}
                        >
                            <div className="flex items-start gap-2.5 p-3">
                                <Icon className={cn("mt-0.5 size-3.5 shrink-0", TONE_COLOR[item.tone])} strokeWidth={2} />
                                <div className="min-w-0 flex-1">
                                    <p className="label-mono flex items-center gap-2 text-ink-muted">
                                        <span className={TONE_COLOR[item.tone]}>{TONE_LABEL[item.tone]}</span>
                                        <span aria-hidden>·</span>
                                        <span className="tabular-nums">{timestamp(item.at)}</span>
                                    </p>
                                    <p className="mt-1 text-[12px] leading-snug font-medium text-ink">{item.title}</p>
                                    {item.description ? <p className="mt-0.5 font-mono text-[10px] leading-relaxed break-all text-ink-soft">{item.description}</p> : null}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => dismiss(item.id)}
                                    aria-label="Dismiss notification"
                                    className="inline-flex size-4 items-center justify-center rounded-[1px] text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
                                >
                                    <X className="size-3" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}
