import { FavoriteButton } from "@/components/projects/favorite-button";
import { ProjectMenu } from "@/components/projects/project-menu";
import { Monogram } from "@/components/ui/monogram";
import { TechBadge } from "@/components/ui/tech-badge";
import { useOrbit } from "@/contexts/orbit-context";
import { shortenPath } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Project, Technology } from "@/types/project";

const ROW_GRID = "grid items-center gap-3 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.45fr)_minmax(0,1.05fr)_auto]";

export function ProjectList({ projects, onOpenDetails, onSelectTech }: { projects: Project[]; onOpenDetails: (project: Project) => void; onSelectTech: (technology: Technology) => void }) {
    return (
        <div className="overflow-hidden rounded-[2px] border border-line bg-panel">
            <div className={cn(ROW_GRID, "hidden border-b border-line bg-panel-inset px-3 py-2 md:grid")}>
                <span className="label-mono text-ink-muted">PROJECT</span>
                <span className="label-mono text-ink-muted">STACK</span>
                <span className="label-mono text-ink-muted">LOCATION</span>
                <span className="label-mono text-right text-ink-muted">ACTIONS</span>
            </div>
            <div className="divide-y divide-line-soft">
                {projects.map((project) => (
                    <ProjectRow key={project.path} project={project} onOpenDetails={onOpenDetails} onSelectTech={onSelectTech} />
                ))}
            </div>
        </div>
    );
}

function ProjectRow({ project, onOpenDetails, onSelectTech }: { project: Project; onOpenDetails: (project: Project) => void; onSelectTech: (technology: Technology) => void }) {
    const { isFavorite, toggleFavorite } = useOrbit();
    const favorite = isFavorite(project.path);
    const name = project.name || "Untitled project";
    const shown = project.technologies.slice(0, 3);
    const hiddenCount = project.technologies.length - shown.length;

    return (
        <div
            onClick={() => onOpenDetails(project)}
            className={cn(
                ROW_GRID,
                "group cursor-pointer px-3 py-2.5 transition-colors hover:bg-white/2.5 focus-within:bg-white/2.5",
                "shadow-[inset_2px_0_0_0_transparent] hover:shadow-[inset_2px_0_0_0_var(--accent)]",
            )}
        >
            <div className="flex min-w-0 items-center gap-2.5">
                <Monogram name={name} size="sm" />
                <span className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpenDetails(project);
                        }}
                        title={name}
                        className="block w-full truncate rounded-[1px] text-left text-[12.5px] font-medium text-ink outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    >
                        {name}
                    </button>
                    <span className="block truncate font-mono text-[9px] text-ink-muted md:hidden" title={project.path}>
                        {shortenPath(project.path, 40)}
                    </span>
                </span>
            </div>

            <div className="hidden min-w-0 flex-wrap items-center gap-1 md:flex" onClick={(event) => event.stopPropagation()}>
                {shown.length > 0 ? (
                    shown.map((tech) => <TechBadge key={tech.name} technology={tech} onClick={() => onSelectTech(tech)} />)
                ) : (
                    <span className="font-mono text-[9px] tracking-[0.08em] text-ink-muted/70 uppercase">none detected</span>
                )}
                {hiddenCount > 0 ? <span className="font-mono text-[9px] text-ink-muted">+{hiddenCount}</span> : null}
            </div>

            <div className="hidden min-w-0 lg:block">
                <span className="block truncate font-mono text-[10px] text-ink-muted" title={project.path}>
                    {shortenPath(project.path, 36)}
                </span>
            </div>

            <div
                className={cn("flex items-center justify-end gap-0.5 transition-opacity", favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}
                onClick={(event) => event.stopPropagation()}
            >
                <FavoriteButton favorite={favorite} onToggle={() => toggleFavorite(project.path)} size="sm" />
                <ProjectMenu project={project} onOpenDetails={onOpenDetails} />
            </div>
        </div>
    );
}
