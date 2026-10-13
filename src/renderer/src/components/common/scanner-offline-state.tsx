import { Button } from "@/components/ui/button";
import { hasPreloadBridge, type OrbitError } from "@/services/orbit";
import { RefreshCw, TriangleAlert, X } from "lucide-react";

export function ScannerOfflineState({ error, onRetry }: { error: OrbitError; onRetry: () => void }) {
    const bridgeOnline = hasPreloadBridge();

    return (
        <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/2">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                    <TriangleAlert className="size-5" strokeWidth={1.8} />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{error.message}</h3>
                        <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-300 uppercase">
                            {error.code.replace(/_/g, " ")}
                        </span>
                    </div>
                    <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">{error.detail ?? "Orbit could not read your workspace."}</p>

                    <p className="mt-3 text-xs text-muted-foreground">
                        {bridgeOnline
                            ? "The main process could not complete the scan. Check the projects directory and try again."
                            : "The renderer could not reach the main process. Rebuild the app so the preload script is loaded."}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                        <Button variant="secondary" size="sm" onClick={onRetry}>
                            <RefreshCw className="size-3.5" />
                            Retry scan
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function ScanErrorBanner({ error, onRetry, onDismiss }: { error: OrbitError; onRetry: () => void; onDismiss: () => void }) {
    return (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-red-400/20 bg-red-400/6 px-3.5 py-2.5">
            <TriangleAlert className="size-4 shrink-0 text-red-300" strokeWidth={1.9} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-foreground">{error.message}</p>
                {error.detail ? <p className="truncate text-[11px] text-muted-foreground">{error.detail}</p> : null}
            </div>
            <Button variant="secondary" size="sm" onClick={onRetry}>
                <RefreshCw className="size-3.5" />
                Retry
            </Button>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss error"
                className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            >
                <X className="size-3.5" />
            </button>
        </div>
    );
}
