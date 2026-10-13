export type TechnologyCategory = "language" | "frontend" | "backend" | "styling" | "database-orm" | "tools";

export type Technology = {
    name: string;
    category: TechnologyCategory;
};

export type Project = {
    name: string;
    path: string;
    technologies: Technology[];
};

/**
 * A workspace root (a directory whose package.json declares `workspaces`).
 * Workspace roots are containers: they are never listed as projects themselves,
 * and `projects` only ever contains children that live inside the workspace.
 */
export type Workspace = {
    name: string;
    path: string;
    projects: Project[];
};

export type ProjectScanResult = {
    rootPath: string;
    scannedAt: number;
    /** Standalone projects only — workspace members are grouped under `workspaces`. */
    projects: Project[];
    /** Serialized form of the scanner's `workspaceMap` (an array, since Map is not structured-cloneable over IPC). */
    workspaces: Workspace[];
};

export type ProjectOpenTarget = "editor" | "terminal" | "file-manager";

export type TechnologyDefinition = {
    packages: string[];
    category: TechnologyCategory;
};

export type PackageManifest = {
    name?: unknown;
    workspaces?: unknown;
    dependencies?: Record<string, unknown>;
    devDependencies?: Record<string, unknown>;
};
