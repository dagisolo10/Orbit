import { FavoriteButton } from "@/components/projects/favorite-button";
import { ProjectMenu } from "@/components/projects/project-menu";
import { Monogram } from "@/components/ui/monogram";
import { TechBadge } from "@/components/ui/tech-badge";
import { useOrbit } from "@/contexts/orbit-context";
import { shortenPath } from "@/lib/format";
import { getCategoryMeta } from "@/lib/tech";
import type { Project, Technology } from "@/types/project";

const MAX_VISIBLE_TECH = 3;
const MAX_VISIBLE_ROLES = 3;

export function ProjectCard({ project, onOpenDetails, onSelectTech }: { project: Project; onOpenDetails: (project: Project) => void; onSelectTech: (technology: Technology) => void }) {
    const { isFavorite, toggleFavorite } = useOrbit();
    const favorite = isFavorite(project.path);
    const name = project.name || "Untitled project";
    const shown = project.technologies.slice(0, MAX_VISIBLE_TECH);
    const hiddenCount = project.technologies.length - shown.length;

    // Category roles give the card a quick technical summary beyond the badges.
    const roles = Array.from(new Set(project.technologies.map((tech) => tech.category)));
    const shownRoles = roles.slice(0, MAX_VISIBLE_ROLES).map((category) => getCategoryMeta(category).short);
    const hiddenRoles = roles.length - shownRoles.length;
    const roleLabel = shownRoles.length > 0 ? `${shownRoles.join(" · ")}${hiddenRoles > 0 ? ` +${hiddenRoles}` : ""}` : "—";

    return (
        <article
            onClick={() => onOpenDetails(project)}
            className="group relative flex min-h-40 cursor-pointer flex-col overflow-hidden rounded-[2px] border border-line bg-panel transition-colors duration-150 hover:border-line-strong hover:bg-panel-raised focus-within:border-line-strong"
        >
            <span aria-hidden className="absolute top-0 h-px w-full transition-all duration-500 bg-accent transform-[scaleX(0)] group-hover:transform-[scaleX(1)] origin-left" />

            <div className="flex items-start gap-3 p-3.5 pb-3">
                <Monogram name={name} />

                <div className="min-w-0 flex-1 pt-0.5">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onOpenDetails(project);
                        }}
                        title={name}
                        className="block w-full truncate rounded-[1px] text-left text-[13.5px] font-semibold tracking-[-0.005em] text-ink outline-none focus-visible:ring-1 focus-visible:ring-accent"
                    >
                        {name}
                    </button>
                    <p className="mt-1 truncate font-mono text-[9.5px] leading-none text-ink-muted" title={project.path}>
                        {shortenPath(project.path, 44)}
                    </p>
                </div>

                <div className="flex shrink-0 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" onClick={(event) => event.stopPropagation()}>
                    <FavoriteButton favorite={favorite} onToggle={() => toggleFavorite(project.path)} />
                    <ProjectMenu project={project} onOpenDetails={onOpenDetails} />
                </div>
            </div>

            <div className="mt-auto border-t border-line-soft">
                <div className="flex items-center justify-between gap-3 px-3.5 pt-2.5 pb-1.5">
                    <p className="flex shrink-0 items-center gap-1.5 font-mono text-[9px] font-medium tracking-[0.16em] text-ink-muted uppercase">
                        Stack
                        <span className="font-mono text-[9px] tabular-nums tracking-normal text-ink-soft">{String(project.technologies.length).padStart(2, "0")}</span>
                    </p>
                    <span className="truncate font-mono text-[8px] tracking-[0.14em] text-ink-muted/70 uppercase" title={roles.map((category) => getCategoryMeta(category).label).join(", ")}>
                        {roleLabel}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 px-3.5 pb-3.5" onClick={(event) => event.stopPropagation()}>
                    {shown.length > 0 ? (
                        shown.map((tech) => <TechBadge key={tech.name} technology={tech} onClick={() => onSelectTech(tech)} />)
                    ) : (
                        <span className="font-mono text-[9px] tracking-[0.08em] text-ink-muted/70 uppercase">
                            <span className="text-accent/70">{"//"}</span> No stack detected
                        </span>
                    )}
                    {hiddenCount > 0 ? (
                        <span className="inline-flex items-center rounded-[2px] border border-line-soft px-1.5 py-0.75 font-mono text-[10px] leading-none text-ink-muted" title={`${hiddenCount} more`}>
                            +{hiddenCount}
                        </span>
                    ) : null}
                </div>
            </div>
        </article>
    );
}
