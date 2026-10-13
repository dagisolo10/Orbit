import { projectMarkers, skipped, techStack } from "@main/scanner/data";
import type { PackageManifest, Project, Technology, Workspace } from "@shared/types/project";
import { Dirent } from "fs";
import { readdir, readFile } from "fs/promises";
import path from "path";

/**
 * Renderer-integration copy of the main-process scanner.
 *
 * This is a deliberate fork of `src/main/scanner/scan.ts`. The original keeps
 * module-global mutable state (a running `count`, an accumulating `projects`
 * array, and a `workspaceMap`); this copy is stateless so that repeated scans
 * never leak or duplicate results. Keep divergence to this file: `scan.ts`
 * remains independently developed.
 */

export type ProjectScanErrorCode = "ROOT_UNREADABLE";

export class ProjectScanError extends Error {
    readonly code: ProjectScanErrorCode;

    constructor(message: string, code: ProjectScanErrorCode) {
        super(message);
        this.name = "ProjectScanError";
        this.code = code;
    }
}

export type ScanResult = {
    /** Standalone projects only; workspace members are grouped under `workspaces`. */
    projects: Project[];
    /** Workspace roots, each with the projects that live inside it. */
    workspaces: Workspace[];
};

/**
 * Recursively scans `rootPath` for `package.json` markers and returns a fresh,
 * de-duplicated set of standalone projects plus workspace groups. Throws only
 * when the configured root itself cannot be read; unreadable sub-directories and
 * malformed manifests are skipped so a single bad entry never aborts the scan.
 */
export async function scanProjects(rootPath: string): Promise<ScanResult> {
    const projects = new Map<string, Project>();
    const workspaces = new Map<string, Workspace>();

    await walk(rootPath, projects, workspaces, true);

    return partition(projects, workspaces);
}

async function walk(dirPath: string, projects: Map<string, Project>, workspaces: Map<string, Workspace>, isRoot: boolean): Promise<void> {
    let entries: Dirent[];

    try {
        entries = await readdir(dirPath, { withFileTypes: true });
    } catch (error) {
        if (isRoot) {
            throw new ProjectScanError("Orbit could not read the projects directory.", "ROOT_UNREADABLE");
        }
        console.error(`[scanner] Skipping unreadable directory: ${dirPath}`, error);
        return;
    }

    if (entries.some((entry) => entry.isFile() && projectMarkers.has(entry.name))) {
        const manifest = await readManifest(path.join(dirPath, "package.json"));

        if (manifest) {
            projects.set(manifest.project.path, manifest.project);

            // A package.json declaring `workspaces` becomes a workspace root. The
            // root's own project is tracked only so it can be excluded from the
            // project lists later; it must never surface as a project.
            if (manifest.isWorkspaceRoot) {
                workspaces.set(manifest.project.path, { name: manifest.project.name, path: manifest.project.path, projects: [] });
            }
        }
    }

    for (const entry of entries) {
        if (!entry.isDirectory() || skipped.has(entry.name)) continue;
        await walk(path.join(dirPath, entry.name), projects, workspaces, false);
    }
}

type Manifest = {
    project: Project;
    isWorkspaceRoot: boolean;
};

async function readManifest(packageJsonPath: string): Promise<Manifest | null> {
    try {
        const content = await readFile(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(content) as PackageManifest;
        const directory = path.dirname(packageJsonPath);

        const dependencies = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies,
        };

        const technologies: Technology[] = [];

        for (const [name, { category, packages }] of Object.entries(techStack)) {
            if (packages.some((pkg) => pkg in dependencies)) {
                technologies.push({ name, category });
            }
        }

        const name = typeof packageJson.name === "string" && packageJson.name.trim().length > 0 ? packageJson.name : path.basename(directory);

        return { project: { name, path: directory, technologies }, isWorkspaceRoot: Boolean(packageJson.workspaces) };
    } catch (error) {
        console.error(`[scanner] Skipping malformed project manifest: ${packageJsonPath}`, error);
        return null;
    }
}

/**
 * Splits discovered projects into standalone projects and workspace groups.
 *
 * Workspace roots are removed from the project lists entirely, and every other
 * project is attached to the closest (most deeply nested) workspace that
 * contains it. Anything outside every workspace stays standalone.
 */
function partition(projects: Map<string, Project>, workspaces: Map<string, Workspace>): ScanResult {
    const roots = new Set([...workspaces.values()].map((workspace) => workspace.path));

    const grouped: Workspace[] = [...workspaces.values()].map((workspace) => ({ name: workspace.name, path: workspace.path, projects: [] })).sort((a, b) => compareByName(a, b));

    const standalone: Project[] = [];

    for (const project of projects.values()) {
        if (roots.has(project.path)) continue;

        const owner = findOwningWorkspace(grouped, project.path);

        if (owner) {
            owner.projects.push(project);
        } else {
            standalone.push(project);
        }
    }

    for (const workspace of grouped) workspace.projects.sort((a, b) => compareByName(a, b));
    standalone.sort((a, b) => compareByName(a, b));

    return { projects: standalone, workspaces: grouped };
}

function findOwningWorkspace(workspaces: Workspace[], projectPath: string): Workspace | undefined {
    let owner: Workspace | undefined;

    for (const workspace of workspaces) {
        if (projectPath === workspace.path) continue;

        const relative = path.relative(workspace.path, projectPath);
        const isInside = relative !== "" && relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);

        if (isInside && (!owner || workspace.path.length > owner.path.length)) {
            owner = workspace;
        }
    }

    return owner;
}

function compareByName(a: { name: string; path: string }, b: { name: string; path: string }): number {
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.path.localeCompare(b.path);
}
