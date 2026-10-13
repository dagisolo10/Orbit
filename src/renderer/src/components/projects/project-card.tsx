import { FavoriteButton } from "@/components/projects/favorite-button";
import { ProjectMenu } from "@/components/projects/project-menu";
import { Monogram } from "@/components/ui/monogram";
import { TechBadge } from "@/components/ui/tech-badge";
import { useOrbit } from "@/contexts/orbit-context";
import { shortenPath } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Project, Technology } from "@/types/project";

const MAX_VISIBLE_TECH = 3;

export function ProjectCard({ project, onOpenDetails, onSelectTech }: { project: Project; onOpenDetails: (project: Project) => void; onSelectTech: (technology: Technology) => void }) {
    const { isFavorite, toggleFavorite } = useOrbit();
    const favorite = isFavorite(project.path);
    const name = project.name || "Untitled project";
    const shown = project.technologies.slice(0, MAX_VISIBLE_TECH);
    const hiddenCount = project.technologies.length - shown.length;

    return (
        <div
            onClick={() => onOpenDetails(project)}
            className="group relative flex cursor-pointer flex-col rounded-xl border border-white/8 bg-card min-h-35 p-3.5 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.035] hover:shadow-[0_18px_45px_-28px_rgba(0,0,0,0.95)] focus-within:border-primary/30"
        >
            <div className="flex items-start gap-3">
                <Monogram name={name} />

                <div className="min-w-0 flex-1">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpenDetails(project);
                        }}
                        title={name}
                        className="block w-full truncate rounded text-left text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        {name}
                    </button>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground" title={project.path}>
                        {shortenPath(project.path)}
                    </p>
                </div>

                <div
                    className={cn("flex shrink-0 items-center gap-0.5 transition-opacity", favorite ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")}
                    onClick={(event) => event.stopPropagation()}
                >
                    <FavoriteButton favorite={favorite} onToggle={() => toggleFavorite(project.path)} />
                    <ProjectMenu project={project} onOpenDetails={onOpenDetails} />
                </div>
            </div>

            <div className="mt-auto flex flex-wrap items-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                {shown.length > 0 ? (
                    shown.map((tech) => <TechBadge key={tech.name} technology={tech} onClick={() => onSelectTech(tech)} />)
                ) : (
                    <span className="text-[11px] text-muted-foreground/70">No technologies detected</span>
                )}
                {hiddenCount > 0 ? <span className="text-[11px] text-muted-foreground/70">+{hiddenCount} more</span> : null}
            </div>
        </div>
    );
}
