import { Button } from "@/components/ui/button";
import { useOrbit } from "@/contexts/orbit-context";
import { hasPreloadBridge, type OrbitError } from "@/services/orbit";
import { FolderSearch, RefreshCw, TriangleAlert, X } from "lucide-react";

export function ScannerOfflineState({ error, onRetry }: { error: OrbitError; onRetry: () => void }) {
    const bridgeOnline = hasPreloadBridge();
    const { projectsRoot, changeProjectsRoot, changingProjectsRoot } = useOrbit();
    const rootUnavailable = Boolean(projectsRoot && !projectsRoot.available);

    return (
        <div className="relative overflow-hidden rounded-[2px] border border-line bg-panel">
            <div aria-hidden className="dot-grid pointer-events-none absolute inset-0 opacity-25" />
            <div aria-hidden className="absolute inset-y-0 left-0 w-[2px] bg-warn/80" />

            <div className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-start">
                <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-[2px] border border-warn/30 bg-warn/10 text-warn">
                    <TriangleAlert className="size-4.5" strokeWidth={1.7} />
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="label-mono text-ink-muted">
                            <span className="text-warn">{"//"}</span> SCANNER OFFLINE
                        </p>
                        <span className="rounded-[1px] border border-warn/30 bg-warn/10 px-1.5 py-0.5 font-mono text-[9px] tracking-[0.1em] text-warn uppercase">
                            {error.code.replace(/_/g, " ")}
                        </span>
                    </div>
                    <h3 className="mt-2 text-[15px] font-semibold tracking-tight text-ink">{error.message}</h3>
                    <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-ink-soft">{error.detail ?? "Orbit could not read your workspace."}</p>

                    <p className="mt-3 font-mono text-[10px] leading-relaxed tracking-[0.02em] text-ink-muted">
                        {!bridgeOnline
                            ? "The renderer could not reach the main process. Rebuild the app so the preload script is loaded."
                            : rootUnavailable
                              ? "Pick the folder that contains your projects, or retry after moving it back."
                              : "The main process could not complete the scan. Check the projects directory and try again."}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        {rootUnavailable ? (
                            <Button variant="primary" size="sm" onClick={changeProjectsRoot} disabled={changingProjectsRoot}>
                                <FolderSearch className={changingProjectsRoot ? "size-3.5 animate-pulse" : "size-3.5"} />
                                {changingProjectsRoot ? "Opening…" : "Choose another folder"}
                            </Button>
                        ) : null}
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
        <div className="flex flex-wrap items-center gap-3 rounded-[2px] border border-danger/25 border-l-2 border-l-danger bg-danger/[0.06] px-3 py-2">
            <span className="label-mono flex shrink-0 items-center gap-1.5 text-danger">
                <TriangleAlert className="size-3.5" strokeWidth={1.9} />
                ERR
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] font-medium text-ink">{error.message}</p>
                {error.detail ? <p className="truncate font-mono text-[10px] text-ink-muted">{error.detail}</p> : null}
            </div>
            <Button variant="secondary" size="sm" onClick={onRetry}>
                <RefreshCw className="size-3" />
                Retry
            </Button>
            <button
                type="button"
                onClick={onDismiss}
                aria-label="Dismiss error"
                className="inline-flex size-5 items-center justify-center rounded-[1px] text-ink-muted transition-colors hover:bg-white/[0.06] hover:text-ink"
            >
                <X className="size-3" />
            </button>
        </div>
    );
}
