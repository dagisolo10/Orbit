import { projectMarkers, skipped, techStack } from "@main/scanner/data";
import { Project, Technology } from "@shared/types/project";
import { readdir, readFile } from "fs/promises";
import path from "path";

let count = 0;
const projects: Project[] = [];

export async function scanDir(fullPath: string) {
    try {
        count += 1;

        const dirPath = path.join(fullPath);

        const entries = await readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name);

            if (skipped.has(entry.name)) {
                continue;
            }

            if (projectMarkers.has(entry.name)) {
                const content = await readFile(fullPath, "utf-8");
                const packageJson = JSON.parse(content);

                const technologies: Technology[] = [];

                const dependencies = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies,
                };

                for (const [name, { category, packages }] of Object.entries(techStack)) {
                    if (packages.some((pkg) => pkg in dependencies)) {
                        technologies.push({
                            name,
                            category,
                        });
                    }
                }

                const project = {
                    technologies,
                    path: path.dirname(fullPath),
                    name: packageJson.name ?? path.basename(path.dirname(fullPath)),
                };

                projects.push(project);

                // console.log(project);
            }

            if (entry.isDirectory()) {
                await scanDir(fullPath);
            }
        }
    } catch (error) {
        console.error("Failed to read dir", error);
    }
}
