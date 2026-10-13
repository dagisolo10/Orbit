import { ProjectCard } from "@/components/projects/project-card";
import type { Project, Technology } from "@/types/project";

export function ProjectGrid({ projects, onOpenDetails, onSelectTech }: { projects: Project[]; onOpenDetails: (project: Project) => void; onSelectTech: (technology: Technology) => void }) {
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] gap-3">
            {projects.map((project) => (
                <ProjectCard key={project.path} project={project} onOpenDetails={onOpenDetails} onSelectTech={onSelectTech} />
            ))}
        </div>
    );
}
