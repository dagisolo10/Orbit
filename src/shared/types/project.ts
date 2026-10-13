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

export type ProjectScanResult = {
    rootPath: string;
    scannedAt: number;
    projects: Project[];
};

export type ProjectOpenTarget = "editor" | "terminal" | "file-manager";

export type TechnologyDefinition = {
    packages: string[];
    category: TechnologyCategory;
};

export type PackageManifest = {
    name?: unknown;
    dependencies?: Record<string, unknown>;
    devDependencies?: Record<string, unknown>;
};
