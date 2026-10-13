export type { Project, ProjectOpenTarget, Technology, TechnologyCategory, Workspace } from "@shared/types/project";

import type { Project, Workspace } from "@shared/types/project";

export type OrbitSnapshot = {
    projects: Project[];
    workspaces: Workspace[];
    rootPath: string | null;
    scannedAt: number | null;
};

export type ProjectScope = "all" | "favorites";

export type ViewMode = "grid" | "list";

export type SortKey = "name-asc" | "name-desc" | "tech-desc" | "tech-asc" | "path-asc";
