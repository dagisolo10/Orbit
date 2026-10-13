import type { OrbitError } from "@/services/orbit";
import type { OrbitSnapshot, Project, SortKey, Technology, TechnologyCategory, ViewMode, Workspace } from "@/types/project";
import type { ProjectsRootState } from "@shared/types/settings";
import { createContext, useContext } from "react";

export type LoadStatus = "loading" | "ready" | "error";

export type TechnologyStat = { name: string; category: TechnologyCategory; count: number };

export type OrbitContextValue = {
    status: LoadStatus;
    snapshot: OrbitSnapshot | null;
    error: OrbitError | null;
    /** The configured projects root, its default, and whether it is currently usable. */
    projectsRoot: ProjectsRootState | null;
    /** True while the native directory picker is open or the selection is being saved. */
    changingProjectsRoot: boolean;
    /** Opens the native picker and, on selection, persists it and re-scans. */
    changeProjectsRoot: () => void;
    /** Standalone projects only. Workspace members live under `workspaces`. */
    projects: Project[];
    /** Every discovered project, standalone and workspace members alike. */
    allProjects: Project[];
    workspaces: Workspace[];
    technologies: TechnologyStat[];
    reload: () => void;
    reScan: () => void;
    reScanning: boolean;
    dismissError: () => void;
    favorites: string[];
    isFavorite: (path: string) => boolean;
    toggleFavorite: (path: string) => void;
    query: string;
    setQuery: (value: string) => void;
    activeTech: Technology | null;
    setActiveTech: (value: Technology | null) => void;
    activeCategory: TechnologyCategory | null;
    setActiveCategory: (value: TechnologyCategory | null) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    sortKey: SortKey;
    setSortKey: (key: SortKey) => void;
};

export const OrbitContext = createContext<OrbitContextValue | null>(null);

export function useOrbit(): OrbitContextValue {
    const context = useContext(OrbitContext);
    if (!context) throw new Error("useOrbit must be used inside an <OrbitProvider>.");
    return context;
}
