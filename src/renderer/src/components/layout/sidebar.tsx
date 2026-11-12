import logo from "@/assets/logo.png";
import { Tooltip } from "@/components/ui/tooltip";
import { useOrbit } from "@/contexts/orbit-context";
import { useServers } from "@/contexts/servers-context";
import { useDrag, type DragHandlers } from "@/hooks/use-drag";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMediaQuery } from "@/hooks/use-media-query";
import { shortenPath } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VIEW_META, type ViewId } from "@/types/navigation";
import { Boxes, ChevronsLeft, ChevronsRight, FolderKanban, Layers, LayoutDashboard, Server, Settings, Star, type LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const NAV_ICON: Record<ViewId, LucideIcon> = {
    overview: LayoutDashboard,
    projects: FolderKanban,
    workspaces: Boxes,
    technologies: Layers,
    favorites: Star,
    servers: Server,
    settings: Settings,
};

const PRIMARY_NAV: ViewId[] = ["overview", "projects", "workspaces", "servers", "technologies", "favorites"];

const SIDEBAR_STORAGE_KEY = "orbit.sidebarCollapsed";

export function Sidebar({ view, onNavigate }: { view: ViewId; onNavigate: (view: ViewId) => void }) {
    const { projects, allProjects, workspaces, technologies, favorites, snapshot, projectsRoot } = useOrbit();
    const { states } = useServers();
    const isNarrow = !useMediaQuery("(min-width: 1024px)");
    const [collapsed, setCollapsed] = useLocalStorage<boolean>(SIDEBAR_STORAGE_KEY, false);
    // Narrow windows are always compact; the manual toggle only applies when there is room to expand.
    const compact = isNarrow || collapsed;

    const [navItems, setNavItems] = useState(PRIMARY_NAV);
    const { dragId, dragOverId, getDragHandlers } = useDrag({ items: navItems, onReorder: setNavItems });

    const runningServers = useMemo(() => Object.values(states).filter((state) => state.status === "running" || state.status === "starting").length, [states]);

    const counts = useMemo<Partial<Record<ViewId, number>>>(
        () => ({
            projects: projects.length,
            workspaces: workspaces.length,
            technologies: technologies.length,
            favorites: allProjects.filter((project) => favorites.includes(project.path)).length,
            servers: runningServers,
        }),
        [projects.length, allProjects, favorites, runningServers, workspaces.length, technologies.length],
    );

    const rootPath = projectsRoot?.path ?? snapshot?.rootPath ?? null;
    const rootAvailable = projectsRoot ? projectsRoot.available : Boolean(snapshot?.rootPath);

    // Desktop convention: Ctrl/Cmd+B toggles the navigation rail.
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (isNarrow || event.altKey) return;
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
                event.preventDefault();
                setCollapsed((value) => !value);
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isNarrow, setCollapsed]);

    // Fixed overlays (toasts) align to the content column, not the rail.
    useEffect(() => {
        document.documentElement.style.setProperty("--sidebar-width", compact ? "3.5rem" : "236px");
        return () => {
            document.documentElement.style.removeProperty("--sidebar-width");
        };
    }, [compact]);

    return (
        <aside
            aria-label="Primary navigation"
            className={cn("relative z-20 flex h-full shrink-0 flex-col border-r border-line bg-panel-inset transition-[width] duration-300 ease-orbit", compact ? "w-14" : "w-59")}
        >
            <Brand compact={compact} onNavigate={onNavigate} />

            <nav aria-label="Modules" className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
                <div className="space-y-px">
                    {navItems.map((id) => (
                        <NavItem
                            key={id}
                            id={id}
                            active={view === id}
                            compact={compact}
                            count={counts[id]}
                            onNavigate={onNavigate}
                            dragging={id === dragId}
                            dragOver={id === dragOverId}
                            dragHandlers={getDragHandlers(id)}
                        />
                    ))}
                </div>
            </nav>

            <div className="shrink-0 space-y-1.5 border-t border-line p-2">
                {!compact ? <RootCard rootPath={rootPath} available={rootAvailable} onNavigate={() => onNavigate("settings")} /> : null}
                <NavItem id="settings" active={view === "settings"} compact={compact} onNavigate={onNavigate} />
                {!isNarrow ? <CollapseToggle compact={compact} onToggle={() => setCollapsed((value) => !value)} /> : null}
            </div>
        </aside>
    );
}

function Brand({ compact, onNavigate }: { compact: boolean; onNavigate: (view: ViewId) => void }) {
    return (
        <div className={cn("flex h-14 shrink-0 items-center border-b border-line", compact ? "justify-center px-0" : "px-3")}>
            <button
                type="button"
                onClick={() => onNavigate("overview")}
                aria-label="Orbit overview"
                title="Orbit overview"
                className={cn(
                    "group flex min-w-0 items-center gap-2.5 rounded-[2px] outline-none transition-opacity hover:opacity-90 focus-visible:ring-1 focus-visible:ring-accent",
                    compact && "justify-center",
                )}
            >
                <span className="relative inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-line bg-bg">
                    <img src={logo} alt="Orbit" className="size-full object-cover" draggable={false} />
                    <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-white/6 ring-inset" />
                </span>
                {!compact ? (
                    <span className="min-w-0 text-left leading-none">
                        <span className="block font-mono text-[12px] font-semibold tracking-[0.3em] text-ink">ORBIT</span>
                        <span className="mt-1 block font-mono text-[8px] tracking-[0.18em] text-ink-muted">LOCAL WORKSPACE</span>
                    </span>
                ) : null}
            </button>
        </div>
    );
}

function NavItem({
    id,
    active,
    compact,
    count,
    onNavigate,
    dragging = false,
    dragOver = false,
    dragHandlers,
}: {
    id: ViewId;
    active: boolean;
    compact: boolean;
    count?: number;
    dragging?: boolean;
    dragOver?: boolean;
    dragHandlers?: DragHandlers;
    onNavigate: (view: ViewId) => void;
}) {
    const Icon = NAV_ICON[id];
    const { label } = VIEW_META[id];
    const showCount = typeof count === "number" && count > 0;

    const button = (
        <button
            type="button"
            {...dragHandlers}
            onClick={() => onNavigate(id)}
            aria-current={active ? "page" : undefined}
            aria-label={compact ? label : undefined}
            className={cn(
                "group relative flex h-9 w-full items-center rounded-[2px] text-[12px] outline-none transition-colors focus-visible:ring-1 focus-visible:ring-accent",
                compact ? "justify-center px-0" : "gap-2.5 px-2",
                active ? "bg-panel-raised text-ink" : "text-ink-soft hover:bg-panel/70 hover:text-ink",
                dragging && "opacity-40",
                dragOver && !dragging && "bg-accent/6",
            )}
        >
            {active ? <span aria-hidden className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 bg-accent" /> : null}
            <Icon className={cn("size-4 shrink-0 transition-colors", active ? "text-accent" : "text-ink-muted group-hover:text-ink-soft")} strokeWidth={1.8} />
            {!compact && (
                <>
                    <span className="min-w-0 flex-1 truncate text-left">{label}</span>
                    {showCount && <span className={cn("font-mono text-[10px] tabular-nums", active ? "text-ink-soft" : "text-ink-muted/80")}>{count > 99 ? "99+" : count}</span>}
                </>
            )}
        </button>
    );

    return compact ? (
        <Tooltip label={label} side="right" className="w-full">
            {button}
        </Tooltip>
    ) : (
        button
    );
}

function RootCard({ rootPath, available, onNavigate }: { rootPath: string | null; available: boolean; onNavigate: () => void }) {
    return (
        <button
            type="button"
            onClick={onNavigate}
            title={rootPath ? `${rootPath} — change projects directory` : "Set a projects directory"}
            className="group w-full rounded-[2px] border border-line bg-panel px-2.5 py-2 text-left outline-none transition-colors hover:border-line-strong hover:bg-panel-raised focus-visible:ring-1 focus-visible:ring-accent"
        >
            <span className="flex items-center gap-1.5">
                <span aria-hidden className={cn("size-1.5 shrink-0 rounded-[1px]", available ? "bg-ok" : "bg-warn")} />
                <span className="label-mono text-ink-muted/80">ROOT</span>
                <span className={cn("ml-auto font-mono text-[8px] tracking-[0.14em] uppercase", available ? "text-ok/90" : "text-warn/90")}>{available ? "Online" : "Offline"}</span>
            </span>
            <span className="mt-1.5 block truncate font-mono text-[10px] text-ink-soft group-hover:text-ink" title={rootPath ?? undefined}>
                {rootPath ? shortenPath(rootPath, 28) : "Not configured"}
            </span>
        </button>
    );
}

function CollapseToggle({ compact, onToggle }: { compact: boolean; onToggle: () => void }) {
    const label = compact ? "Expand sidebar" : "Collapse sidebar";
    const Icon = compact ? ChevronsRight : ChevronsLeft;

    const button = (
        <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            title={`${label} (Ctrl/Cmd+B)`}
            className={cn(
                "group flex h-8 w-full items-center rounded-[2px] text-[11px] text-ink-muted outline-none transition-colors hover:bg-panel/70 hover:text-ink-soft focus-visible:ring-1 focus-visible:ring-accent",
                compact ? "justify-center px-0" : "gap-2 px-2",
            )}
        >
            <Icon className="size-3.5 shrink-0" strokeWidth={1.8} />
            {!compact ? (
                <>
                    <span className="flex-1 text-left">Collapse</span>
                    <span aria-hidden className="font-mono text-[9px] tracking-[0.08em] text-ink-muted/50">
                        CTRL B
                    </span>
                </>
            ) : null}
        </button>
    );

    return compact ? (
        <Tooltip label={label} side="right" className="w-full">
            {button}
        </Tooltip>
    ) : (
        button
    );
}
