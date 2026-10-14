import logo from "@/assets/logo.png";
import { Tooltip } from "@/components/ui/tooltip";
import { useOrbit } from "@/contexts/orbit-context";
import { useServers } from "@/contexts/servers-context";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useMediaQuery } from "@/hooks/use-media-query";
import { shortenPath } from "@/lib/format";
import { cn } from "@/lib/utils";
import { VIEW_META, type ViewId } from "@/types/navigation";
import { Boxes, ChevronLeft, ChevronRight, FolderKanban, Layers, LayoutDashboard, Server, Settings, Star, type LucideIcon } from "lucide-react";
import { useMemo } from "react";

const NAV_ICON: Record<ViewId, LucideIcon> = {
    overview: LayoutDashboard,
    projects: FolderKanban,
    servers: Server,
    workspaces: Boxes,
    technologies: Layers,
    favorites: Star,
    settings: Settings,
};

const PRIMARY_NAV: ViewId[] = ["overview", "projects", "servers", "workspaces", "technologies", "favorites"];

export function Sidebar({ view, onNavigate }: { view: ViewId; onNavigate: (view: ViewId) => void }) {
    const { projects, allProjects, workspaces, technologies, favorites, snapshot, projectsRoot } = useOrbit();
    const { states } = useServers();
    const isNarrow = !useMediaQuery("(min-width: 1024px)");
    const [collapsed, setCollapsed] = useLocalStorage<boolean>("orbit:sidebar-collapsed", false);
    // Narrow windows are always compact; the manual toggle only applies when there is room to expand.
    const compact = isNarrow || collapsed;

    const runningServers = useMemo(() => Object.values(states).filter((state) => state.status === "running" || state.status === "starting").length, [states]);

    const counts = useMemo<Partial<Record<ViewId, number>>>(
        () => ({
            projects: projects.length,
            servers: runningServers,
            workspaces: workspaces.length,
            technologies: technologies.length,
            favorites: allProjects.filter((project) => favorites.includes(project.path)).length,
        }),
        [projects.length, allProjects, runningServers, workspaces.length, technologies.length, favorites],
    );

    return (
        <aside className={cn("relative flex h-full shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-500 ease-out", compact ? "w-17" : "w-62")}>
            {!isNarrow ? <SidebarToggle collapsed={compact} onToggle={() => setCollapsed((value) => !value)} /> : null}

            <Brand compact={compact} />

            <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4">
                {PRIMARY_NAV.map((id) => (
                    <NavItem key={id} id={id} active={view === id} compact={compact} count={counts[id]} onNavigate={onNavigate} />
                ))}
            </nav>

            <div className="space-y-1.5 border-t border-sidebar-border p-2.5">
                {!compact ? (
                    <DirectoryCard
                        rootPath={projectsRoot?.path ?? snapshot?.rootPath ?? null}
                        available={projectsRoot ? projectsRoot.available : Boolean(snapshot?.rootPath)}
                        onNavigate={() => onNavigate("settings")}
                    />
                ) : null}
                <NavItem id="settings" active={view === "settings"} compact={compact} onNavigate={onNavigate} />
            </div>
        </aside>
    );
}

/** Faded control that sits on the sidebar's right border and toggles its width. */
function SidebarToggle({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
    const Icon = collapsed ? ChevronRight : ChevronLeft;
    const label = collapsed ? "Expand sidebar" : "Collapse sidebar";

    return (
        <button
            type="button"
            onClick={onToggle}
            aria-label={label}
            title={label}
            className="absolute top-6 right-0 z-100 inline-flex size-6 translate-x-1/2 items-center justify-center rounded-full border border-sidebar-border bg-sidebar text-muted-foreground shadow-[0_2px_8px_-2px_rgba(0,0,0,0.6)]  transition hover:text-foreground  focus-visible:ring-2 focus-visible:ring-sidebar-ring "
        >
            <Icon className="size-3.5" />
        </button>
    );
}

function Brand({ compact }: { compact: boolean }) {
    return (
        <div className={cn("flex shrink-0 items-center gap-2.5 border-b border-sidebar-border h-18 px-4", compact && "justify-center px-0")}>
            <span className="inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg shadow-[0_10px_24px_-10px_rgba(124,92,240,0.95)]">
                <img src={logo} alt="Orbit" className="size-full object-cover" draggable={false} />
            </span>
            {!compact ? (
                <div className="min-w-0">
                    <p className="text-sm font-semibold tracking-tight text-foreground">Orbit</p>
                    <p className="truncate text-[11px] text-muted-foreground">Project workspace</p>
                </div>
            ) : null}
        </div>
    );
}

function NavItem({ id, active, compact, count, onNavigate }: { id: ViewId; active: boolean; compact: boolean; count?: number; onNavigate: (view: ViewId) => void }) {
    const Icon = NAV_ICON[id];
    const { label } = VIEW_META[id];

    const button = (
        <button
            type="button"
            onClick={() => onNavigate(id)}
            aria-current={active ? "page" : undefined}
            aria-label={compact ? label : undefined}
            className={cn(
                "group relative flex w-full items-center gap-2.5 rounded-lg py-2 text-[13px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                compact ? "justify-center px-0" : "px-2.5",
                active ? "bg-white/[0.07] text-foreground" : "text-sidebar-foreground/70 hover:bg-white/4 hover:text-foreground",
            )}
        >
            {active ? <span className="absolute top-1/2 left-0 h-4 w-0.5 -translate-y-1/2 rounded-full bg-primary" /> : null}
            <Icon className={cn("size-4.5 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} strokeWidth={1.9} />
            {!compact ? <span className="flex-1 text-left">{label}</span> : null}
            {!compact && typeof count === "number" && count > 0 ? <span className="text-[11px] tabular-nums text-muted-foreground/70">{count}</span> : null}
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

function DirectoryCard({ rootPath, available, onNavigate }: { rootPath: string | null; available: boolean; onNavigate: () => void }) {
    return (
        <button
            type="button"
            onClick={onNavigate}
            title="Change projects directory"
            className="group w-full rounded-xl border border-white/6 bg-white/2 p-2.5 text-left outline-none transition-colors hover:border-white/12 hover:bg-white/4 focus-visible:ring-2 focus-visible:ring-sidebar-ring"
        >
            <div className="flex items-center gap-1.5">
                <span className={cn("size-1.5 rounded-full", available ? "bg-emerald-400" : "bg-amber-400/80")} />
                <p className="text-[10px] font-semibold tracking-wider text-muted-foreground/80 uppercase">Projects directory</p>
            </div>
            <p className={cn("mt-1.5 font-mono text-[11px] leading-snug break-all", rootPath && available ? "text-foreground/80" : "text-muted-foreground")} title={rootPath ?? undefined}>
                {rootPath ? shortenPath(rootPath, 26) : "Not configured"}
            </p>
        </button>
    );
}
