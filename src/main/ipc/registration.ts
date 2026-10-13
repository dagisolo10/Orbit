import { openProject, ProjectActionError } from "@main/scanner/project-actions";
import { ProjectScanError, scanProjects } from "@main/scanner/project-scanner";
import { IpcHandlers } from "@shared/types/ipc-handlers";
import { app, ipcMain } from "electron";
import path from "path";

type IpcHandleListener<Channel extends keyof IpcHandlers> = (...args: IpcHandlers[Channel]["args"]) => IpcHandlers[Channel]["return"] | Promise<IpcHandlers[Channel]["return"]>;

function handleIpc<Channel extends keyof IpcHandlers>(channel: Channel, listener: IpcHandleListener<Channel>) {
    ipcMain.handle(channel, async (_event, ...args: IpcHandlers[Channel]["args"]) => listener(...args));
}

/**
 * Orbit has no user-facing directory picker yet, so the scan root mirrors the
 * original scanner's convention (`<home>/Projects`). Root selection is the one
 * capability still missing from the main process.
 */
function getProjectsRoot(): string {
    return path.join(app.getPath("home"), "Projects");
}

export function registerIpcHandlers() {
    handleIpc("ipc:check", () => console.log("IPC CHECK"));

    handleIpc("projects:scan", async () => {
        const rootPath = getProjectsRoot();

        try {
            const projects = await scanProjects(rootPath);
            return { projects, rootPath, scannedAt: Date.now() };
        } catch (error) {
            if (error instanceof ProjectScanError) {
                throw new Error(error.message);
            }
            console.error("[projects:scan] Unexpected scan failure", error);
            throw new Error("Orbit could not scan your projects.");
        }
    });

    handleIpc("project:open", async (projectPath, target) => {
        try {
            await openProject(projectPath, target);
        } catch (error) {
            if (error instanceof ProjectActionError) {
                throw new Error(error.message);
            }
            console.error("[project:open] Unexpected failure", error);
            throw new Error("Orbit could not open that project.");
        }
    });
}
