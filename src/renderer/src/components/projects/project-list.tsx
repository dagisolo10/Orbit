import { FavoriteButton } from "@/components/projects/favorite-button";
import { ProjectMenu } from "@/components/projects/project-menu";
import { Monogram } from "@/components/ui/monogram";
import { TechBadge } from "@/components/ui/tech-badge";
import { useOrbit } from "@/contexts/orbit-context";
import { shortenPath } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Project, Technology } from "@/types/project";

const ROW_GRID = "grid items-center gap-3 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.4fr)_auto] lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1.5fr)_minmax(0,1.1fr)_auto]";

export function ProjectList({ projects, onOpenDetails, onSelectTech }: { projects: Project[]; onOpenDetails: (project: Project) => void; onSelectTech: (technology: Technology) => void }) {
    return (
        <div className="overflow-hidden rounded-xl border border-white/8 bg-white/1.5">
            <div className={cn(ROW_GRID, "hidden border-b border-white/8 px-3 py-2 text-[11px] font-semibold tracking-wider text-muted-foreground/70 uppercase md:grid")}>
                <span>Project</span>
                <span>Technologies</span>
                <span className="hidden lg:block">Location</span>
                <span className="text-right">Actions</span>
            </div>
            <div className="divide-y divide-white/6">
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
        <div onClick={() => onOpenDetails(project)} className={cn(ROW_GRID, "group cursor-pointer px-3 py-2.5 transition-colors hover:bg-white/3")}>
            <div className="flex min-w-0 items-center gap-2.5">
                <Monogram name={name} size="sm" />
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenDetails(project);
                    }}
                    title={name}
                    className="min-w-0 flex-1 truncate rounded text-left text-[13px] font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    {name}
                </button>
            </div>

            <div className="hidden min-w-0 flex-wrap items-center gap-1.5 md:flex" onClick={(event) => event.stopPropagation()}>
                {shown.length > 0 ? (
                    shown.map((tech) => <TechBadge key={tech.name} technology={tech} onClick={() => onSelectTech(tech)} />)
                ) : (
                    <span className="text-[11px] text-muted-foreground/70">—</span>
                )}
                {hiddenCount > 0 ? <span className="text-[11px] text-muted-foreground/70">+{hiddenCount}</span> : null}
            </div>

            <div className="hidden min-w-0 lg:block">
                <span className="block truncate font-mono text-[11px] text-muted-foreground" title={project.path}>
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
