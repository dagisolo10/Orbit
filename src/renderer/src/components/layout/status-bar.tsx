import { useInterfaceScale } from "@/contexts/interface-scale-context";
import { useOrbit } from "@/contexts/orbit-context";
import { useServers } from "@/contexts/servers-context";
import { formatRelativeTime, shortenPath } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/types/navigation";
import { Minus, Plus } from "lucide-react";
import { useMemo } from "react";

export function StatusBar({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    const { status, projectsRoot, snapshot, projects, workspaces, technologies, favorites, allProjects, reScanning, error } = useOrbit();
    const { projects: serverProjects, states } = useServers();
    const { scale, canIncrease, canDecrease, increase, decrease, reset: resetScale } = useInterfaceScale();

    const rootPath = projectsRoot?.path ?? snapshot?.rootPath ?? null;
    const available = projectsRoot ? projectsRoot.available : Boolean(snapshot?.rootPath);
    const custom = projectsRoot?.isCustom ?? false;

    const runningServers = useMemo(() => Object.values(states).filter((state) => state.status === "running" || state.status === "starting").length, [states]);
    const favoriteCount = useMemo(() => allProjects.filter((project) => favorites.includes(project.path)).length, [allProjects, favorites]);

    const state = reScanning || status === "loading" ? "scanning" : status === "error" ? "error" : available || rootPath ? "ready" : "unset";
    const stateLabel = state === "scanning" ? "SCANNING" : state === "error" ? "DEGRADED" : state === "unset" ? "UNSET" : "READY";
    const stateDot = state === "scanning" ? "bg-warn animate-pulse" : state === "error" ? "bg-danger" : state === "unset" ? "bg-warn" : "bg-ok";

    return (
        <div className="flex h-9 shrink-0 items-center gap-3 overflow-hidden border-t border-line bg-panel-inset px-4 font-mono text-[10px] tracking-[0.08em] text-ink-muted uppercase select-none">
            <button
                type="button"
                onClick={() => onNavigate("settings")}
                title={rootPath ? `${rootPath} — change projects directory` : "Set a projects directory"}
                className="group flex min-w-0 items-center gap-2 rounded-[1px] outline-none transition-colors hover:text-ink-soft focus-visible:ring-1 focus-visible:ring-accent"
            >
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-[1px]", stateDot)} />
                <span className="hidden text-ink-muted/70 sm:inline">ROOT</span>
                <span className="truncate text-ink-soft normal-case tracking-normal group-hover:text-ink" style={{ maxWidth: "22rem" }}>
                    {rootPath ? shortenPath(rootPath, 42) : "Not configured"}
                </span>
                {rootPath ? <span className="hidden shrink-0 border border-line px-1 py-px text-[8px] tracking-[0.14em] text-ink-muted lg:inline">{custom ? "CUSTOM" : "DEFAULT"}</span> : null}
            </button>

            <Divider />

            <Readout label="PRJ" value={String(projects.length)} />
            <Readout label="WS" value={String(workspaces.length)} className="hidden sm:flex" />
            <Readout label="STACK" value={String(technologies.length)} className="hidden md:flex" />
            <Readout label="FAV" value={String(favoriteCount)} className="hidden xl:flex" />

            <Divider className="hidden md:block" />

            <button
                type="button"
                onClick={() => onNavigate("servers")}
                className="hidden items-center gap-1.5 rounded-[1px] outline-none transition-colors hover:text-ink-soft focus-visible:ring-1 focus-visible:ring-accent md:flex"
            >
                <span className="text-ink-muted/70">SRV</span>
                <span className={cn("tabular-nums", runningServers > 0 ? "text-ok" : "text-ink-soft")}>
                    {String(runningServers).padStart(2, "0")}/{String(serverProjects.length).padStart(2, "0")}
                </span>
            </button>

            <div className="ml-auto flex shrink-0 items-center gap-3">
                {error && status === "ready" ? <span className="hidden text-danger/90 sm:inline">SCAN ISSUE</span> : null}
                <span className="hidden items-center gap-1.5 sm:flex">
                    <span className="text-ink-muted/70">LAST</span>
                    <span className="text-ink-soft tabular-nums">{snapshot?.scannedAt ? formatRelativeTime(snapshot.scannedAt) : "—"}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                    <span className="text-ink-muted/70">UI</span>
                    <span className="flex items-center border border-line bg-panel">
                        <button
                            type="button"
                            onClick={decrease}
                            disabled={!canDecrease}
                            title="Zoom out (Shift + -)"
                            aria-label="Decrease interface scale"
                            className="inline-flex size-5 items-center justify-center text-ink-muted outline-none transition-colors hover:bg-panel-raised hover:text-ink focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40"
                        >
                            <Minus className="size-2.5" strokeWidth={2.2} />
                        </button>
                        <button
                            type="button"
                            onClick={resetScale}
                            aria-label="Reset interface scale"
                            title="Reset interface scale (Shift + 0)"
                            className="inline-flex h-5 min-w-10 items-center justify-center border-x border-line px-1.5 font-mono text-[10px] tabular-nums text-ink-soft outline-none transition-colors hover:bg-panel-raised hover:text-ink focus-visible:ring-1 focus-visible:ring-accent"
                        >
                            {Math.round(scale * 100)}%
                        </button>
                        <button
                            type="button"
                            onClick={increase}
                            disabled={!canIncrease}
                            title="Zoom in (Shift + +)"
                            aria-label="Increase interface scale"
                            className="inline-flex size-5 items-center justify-center text-ink-muted outline-none transition-colors hover:bg-panel-raised hover:text-ink focus-visible:ring-1 focus-visible:ring-accent disabled:pointer-events-none disabled:opacity-40"
                        >
                            <Plus className="size-2.5" strokeWidth={2.2} />
                        </button>
                    </span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span aria-hidden className={cn("size-1.5 shrink-0 rounded-[1px]", stateDot)} />
                    <span className={cn(state === "error" ? "text-danger" : state === "scanning" ? "text-warn" : "text-ink-soft")}>{stateLabel}</span>
                </span>
            </div>
        </div>
    );
}

function Divider({ className }: { className?: string }) {
    return <span aria-hidden className={cn("h-3 w-px shrink-0 bg-line", className)} />;
}

function Readout({ label, value, className }: { label: string; value: string; className?: string }) {
    return (
        <span className={cn("flex shrink-0 items-center gap-1.5", className)}>
            <span className="text-ink-muted/70">{label}</span>
            <span className="text-ink-soft tabular-nums">{value.padStart(2, "0")}</span>
        </span>
    );
}
