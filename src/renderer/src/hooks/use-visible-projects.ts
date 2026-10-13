import { useOrbit } from "@/contexts/orbit-context";
import type { Project, ProjectScope, SortKey } from "@/types/project";
import { useMemo } from "react";

export function sortProjects(projects: Project[], sortKey: SortKey): Project[] {
    const list = [...projects];
    const byName = (a: Project, b: Project) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.path.localeCompare(b.path);

    switch (sortKey) {
        case "name-asc":
            return list.sort(byName);
        case "name-desc":
            return list.sort((a, b) => byName(b, a));
        case "tech-desc":
            return list.sort((a, b) => b.technologies.length - a.technologies.length || byName(a, b));
        case "tech-asc":
            return list.sort((a, b) => a.technologies.length - b.technologies.length || byName(a, b));
        case "path-asc":
            return list.sort((a, b) => a.path.localeCompare(b.path) || byName(a, b));
        default:
            return list;
    }
}

export function useVisibleProjects(scope: ProjectScope): Project[] {
    const { projects, favorites, query, activeTech, activeCategory, sortKey } = useOrbit();

    return useMemo(() => {
        let list = projects;

        if (scope === "favorites") {
            list = list.filter((project) => favorites.includes(project.path));
        }

        if (activeTech) {
            list = list.filter((project) => project.technologies.some((tech) => tech.name === activeTech.name));
        }

        if (activeCategory) {
            list = list.filter((project) => project.technologies.some((tech) => tech.category === activeCategory));
        }

        const term = query.trim().toLowerCase();
        if (term) {
            list = list.filter(
                (project) => project.name.toLowerCase().includes(term) || project.path.toLowerCase().includes(term) || project.technologies.some((tech) => tech.name.toLowerCase().includes(term)),
            );
        }

        return sortProjects(list, sortKey);
    }, [projects, favorites, query, activeTech, activeCategory, sortKey, scope]);
}
