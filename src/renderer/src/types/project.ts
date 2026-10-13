export type { Project, ProjectOpenTarget, Technology, TechnologyCategory } from "@shared/types/project";

import type { Project } from "@shared/types/project";

export type OrbitSnapshot = {
    projects: Project[];
    rootPath: string | null;
    scannedAt: number | null;
};

export type ProjectScope = "all" | "favorites";

export type ViewMode = "grid" | "list";

export type SortKey = "name-asc" | "name-desc" | "tech-desc" | "tech-asc" | "path-asc";
