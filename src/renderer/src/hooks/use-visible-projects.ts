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

/**
 * The single definition of what a project search term matches: its name, path,
 * or any of its technologies. Shared by the explorer and the server project
 * picker so their search behavior never drifts apart.
 */
export function projectMatchesTerm(project: Project, term: string): boolean {
    const needle = term.trim().toLowerCase();
    if (needle.length === 0) return true;
    return project.name.toLowerCase().includes(needle) || project.path.toLowerCase().includes(needle) || project.technologies.some((tech) => tech.name.toLowerCase().includes(needle));
}

/** Filters a project list by a search term using the shared matching rule. */
export function filterProjectsByQuery(projects: Project[], query: string): Project[] {
    if (query.trim().length === 0) return projects;
    return projects.filter((project) => projectMatchesTerm(project, query));
}

export function useVisibleProjects(scope: ProjectScope): Project[] {
    const { projects, allProjects, favorites, query, activeTech, activeCategory, sortKey } = useOrbit();

    return useMemo(() => {
        // "all" reflects the standalone projects view; favorites can point at any
        // discovered project, including members of a workspace.
        let list = scope === "favorites" ? allProjects : projects;

        if (scope === "favorites") {
            list = list.filter((project) => favorites.includes(project.path));
        }

        if (activeTech) {
            list = list.filter((project) => project.technologies.some((tech) => tech.name === activeTech.name));
        }

        if (activeCategory) {
            list = list.filter((project) => project.technologies.some((tech) => tech.category === activeCategory));
        }

        list = filterProjectsByQuery(list, query);

        return sortProjects(list, sortKey);
    }, [projects, allProjects, favorites, query, activeTech, activeCategory, sortKey, scope]);
}
