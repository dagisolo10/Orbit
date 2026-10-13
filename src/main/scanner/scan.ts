import { projectMarkers, skipped, techStack } from "@main/scanner/data";
import { Project, Technology } from "@shared/types/project";
import { readdir, readFile } from "fs/promises";
import path from "path";

type Workspace = {
    name: string;
    path: string;
    projects: Project[];
};

let count = 0;
export const projects: Project[] = [];
export const workspaceMap = new Map<string, Workspace>();

export async function scanDir(fullPath: string) {
    try {
        count += 1;

        const dirPath = path.join(fullPath);

        const entries = await readdir(dirPath, { withFileTypes: true });

        const packageJsonEntry = entries.find((entry) => entry.name === "package.json" && entry.isFile());

        if (packageJsonEntry) {
            await checkAndCreateWorkspace(path.join(dirPath, packageJsonEntry.name));
        }

        outer: for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (skipped.has(entry.name)) {
                continue;
            }

            if (projectMarkers.has(entry.name)) {
                const content = await readFile(fullPath, "utf-8");
                const packageJson = JSON.parse(content);

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

                const project = {
                    technologies,
                    path: path.dirname(fullPath),
                    name: packageJson.name ?? path.basename(path.dirname(fullPath)),
                };

                const workspaces = [...workspaceMap.values()];

                for (const workspace of workspaces) {
                    const relativePath = path.relative(workspace.path, project.path);

                    const isInsideWorkspace = relativePath !== "" && !relativePath.startsWith(`..${path.sep}`) && relativePath !== ".." && !path.isAbsolute(relativePath);

                    if (project.path === workspace.path) {
                        continue outer;
                    }

                    if (isInsideWorkspace) {
                        workspace.projects.push(project);
                        continue outer;
                    }
                }

                projects.push(project);
            }

            if (entry.isDirectory()) {
                await scanDir(fullPath);
            }
        }
    } catch (error) {
        console.error("Failed to read dir", error);
    }
}

async function checkAndCreateWorkspace(packageJsonPath: string) {
    const content = await readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(content);

    if (!packageJson.workspaces) return;

    workspaceMap.set(packageJsonPath, {
        projects: [],
        path: path.dirname(packageJsonPath),
        name: packageJson.name ?? path.basename(path.dirname(packageJsonPath)),
    });
}
