import { projectMarkers, skipped, techStack } from "@main/scanner/data";
import type { PackageManifest, Project, Technology } from "@shared/types/project";
import { Dirent } from "fs";
import { readdir, readFile } from "fs/promises";
import path from "path";

/**
 * Renderer-integration copy of the main-process scanner.
 *
 * This is a deliberate fork of `src/main/scan.ts`. The original keeps module-global
 * mutable state (a running `count` and a `projects` array that accumulates across
 * calls); this copy is stateless so that repeated scans never leak or duplicate
 * results. Keep divergence to this file: `scan.ts` remains independently developed.
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

/**
 * Recursively scans `rootPath` for `package.json` markers and returns a fresh,
 * de-duplicated array of typed projects. Throws only when the configured root
 * itself cannot be read; unreadable sub-directories and malformed manifests are
 * skipped so a single bad entry never aborts the scan.
 */
export async function scanProjects(rootPath: string): Promise<Project[]> {
    const found = new Map<string, Project>();
    await walk(rootPath, found, true);
    return Array.from(found.values()).sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.path.localeCompare(b.path));
}

async function walk(dirPath: string, found: Map<string, Project>, isRoot: boolean): Promise<void> {
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

    for (const entry of entries) {
        if (skipped.has(entry.name)) {
            continue;
        }

        const entryPath = path.join(dirPath, entry.name);

        if (projectMarkers.has(entry.name)) {
            const project = await readProject(entryPath);

            if (project) {
                found.set(project.path, project);
            }
        }

        if (entry.isDirectory()) {
            await walk(entryPath, found, false);
        }
    }
}

async function readProject(packageJsonPath: string): Promise<Project | null> {
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

        return { name, path: directory, technologies };
    } catch (error) {
        console.error(`[scanner] Skipping malformed project manifest: ${packageJsonPath}`, error);
        return null;
    }
}
