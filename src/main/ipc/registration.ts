import { listLaunchApps, validatePreference } from "@main/launcher/apps";
import { isLocalUrl } from "@main/server/manager";
import { serverService } from "@main/server/service";
import { ServerConfigError } from "@main/server/store";
import { openProject, ProjectActionError } from "@main/scanner/project-actions";
import { ProjectScanError, scanProjects } from "@main/scanner/project-scanner";
import { getLaunchPreferences, setLaunchPreference, SettingsError, getProjectsRootState, resolveProjectsRoot, setProjectsRoot } from "@main/settings/store";
import { IpcHandlers } from "@shared/types/ipc-handlers";
import type { ServerProjectDraft } from "@shared/types/server";
import type { LaunchKind, LaunchPreference } from "@shared/types/settings";
import { app, BrowserWindow, dialog, ipcMain, shell, type OpenDialogOptions } from "electron";

type IpcHandleListener<Channel extends keyof IpcHandlers> = (...args: IpcHandlers[Channel]["args"]) => IpcHandlers[Channel]["return"] | Promise<IpcHandlers[Channel]["return"]>;

function handleIpc<Channel extends keyof IpcHandlers>(channel: Channel, listener: IpcHandleListener<Channel>) {
    ipcMain.handle(channel, async (_event, ...args: IpcHandlers[Channel]["args"]) => listener(...args));
}

/** Only these hosts may be opened in the user's browser, regardless of caller. */
const EXTERNAL_HOSTS = new Set(["orbit.dagidev.com", "dagidev.com", "github.com", "www.github.com"]);

function isAllowedExternalUrl(value: unknown): value is string {
    if (typeof value !== "string") return false;
    try {
        const url = new URL(value);
        return url.protocol === "https:" && EXTERNAL_HOSTS.has(url.hostname);
    } catch {
        return false;
    }
}

/** Re-validates a renderer-supplied preference, since IPC input is untrusted. */
function coercePreference(input: unknown): LaunchPreference | null {
    if (!input || typeof input !== "object") return null;
    const candidate = input as Record<string, unknown>;
    if (candidate["mode"] === "auto") return { mode: "auto" };
    if (candidate["mode"] === "preset" && typeof candidate["id"] === "string" && candidate["id"].trim().length > 0) {
        return { mode: "preset", id: candidate["id"] };
    }
    if (candidate["mode"] === "custom" && typeof candidate["command"] === "string" && candidate["command"].trim().length > 0) {
        return { mode: "custom", command: candidate["command"].trim() };
    }
    return null;
}

function isLaunchKind(value: unknown): value is LaunchKind {
    return value === "editor" || value === "terminal";
}

/** Re-validates renderer-supplied server draft fields, since IPC input is untrusted. */
function coerceServerDraft(input: unknown): ServerProjectDraft {
    if (!input || typeof input !== "object") {
        throw new Error("Orbit could not read those project details.");
    }
    const candidate = input as Record<string, unknown>;
    return {
        name: typeof candidate["name"] === "string" ? candidate["name"] : "",
        path: typeof candidate["path"] === "string" ? candidate["path"] : "",
        command: typeof candidate["command"] === "string" ? candidate["command"] : "",
    };
}

function requireServerId(value: unknown): string {
    if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error("Orbit could not identify that project.");
    }
    return value;
}

function toServerError(error: unknown, fallback: string): Error {
    if (error instanceof ServerConfigError) return new Error(error.message);
    console.error("[servers] Unexpected failure", error);
    return new Error(fallback);
}

export function registerIpcHandlers() {
    handleIpc("projects:scan", async () => {
        const rootPath = await resolveProjectsRoot();

        try {
            const { projects, workspaces } = await scanProjects(rootPath);
            return { projects, workspaces, rootPath, scannedAt: Date.now() };
        } catch (error) {
            if (error instanceof ProjectScanError) {
                throw new Error(`Orbit could not read the projects directory at ${rootPath}. It may have been moved, renamed, or deleted.`);
            }
            console.error("[projects:scan] Unexpected scan failure", error);
            throw new Error("Orbit could not scan your projects.");
        }
    });

    handleIpc("project:open", async (projectPath, target) => {
        try {
            await openProject(projectPath, target, await getLaunchPreferences());
        } catch (error) {
            if (error instanceof ProjectActionError) {
                throw new Error(error.message);
            }
            console.error("[project:open] Unexpected failure", error);
            throw new Error("Orbit could not open that project.");
        }
    });

    handleIpc("launcher:list", () => listLaunchApps());

    handleIpc("servers:list", () => serverService.snapshot());

    handleIpc("servers:add", async (draft) => {
        try {
            return await serverService.add(coerceServerDraft(draft));
        } catch (error) {
            throw toServerError(error, "Orbit could not add that project.");
        }
    });

    handleIpc("servers:update", async (id, draft) => {
        try {
            return await serverService.update(requireServerId(id), coerceServerDraft(draft));
        } catch (error) {
            throw toServerError(error, "Orbit could not save that project.");
        }
    });

    handleIpc("servers:remove", async (id) => {
        try {
            return await serverService.remove(requireServerId(id));
        } catch (error) {
            throw toServerError(error, "Orbit could not remove that project.");
        }
    });

    handleIpc("servers:start", async (id) => {
        try {
            return await serverService.start(requireServerId(id));
        } catch (error) {
            throw toServerError(error, "Orbit could not start that server.");
        }
    });

    handleIpc("servers:stop", async (id) => {
        try {
            return await serverService.stop(requireServerId(id));
        } catch (error) {
            throw toServerError(error, "Orbit could not stop that server.");
        }
    });

    handleIpc("servers:restart", async (id) => {
        try {
            return await serverService.restart(requireServerId(id));
        } catch (error) {
            throw toServerError(error, "Orbit could not restart that server.");
        }
    });

    handleIpc("servers:clear-logs", (id) => serverService.clearLogs(requireServerId(id)));

    handleIpc("settings:get-projects-root", () => getProjectsRootState());

    handleIpc("settings:set-projects-root", async (rootPath) => {
        try {
            return await setProjectsRoot(rootPath);
        } catch (error) {
            if (error instanceof SettingsError) {
                throw new Error(error.message);
            }
            console.error("[settings:set-projects-root] Unexpected failure", error);
            throw new Error("Orbit could not save that projects folder.");
        }
    });

    handleIpc("settings:get-launch-preferences", () => getLaunchPreferences());

    handleIpc("settings:set-launch-preference", async (kind, preference) => {
        if (!isLaunchKind(kind)) {
            throw new Error("Orbit does not support that application type.");
        }

        const coerced = coercePreference(preference);
        if (!coerced) {
            throw new Error("That application setting is not valid.");
        }

        const problem = await validatePreference(kind, coerced);
        if (problem) {
            throw new Error(problem);
        }

        try {
            return await setLaunchPreference(kind, coerced);
        } catch (error) {
            if (error instanceof SettingsError) {
                throw new Error(error.message);
            }
            console.error("[settings:set-launch-preference] Unexpected failure", error);
            throw new Error("Orbit could not save that application setting.");
        }
    });

    handleIpc("dialog:pick-directory", async (defaultPath, title) => {
        const properties: OpenDialogOptions["properties"] = ["openDirectory"];
        if (process.platform === "darwin") properties.push("createDirectory");

        const options: OpenDialogOptions = {
            title: typeof title === "string" && title.length > 0 ? title : "Select projects directory",
            defaultPath: typeof defaultPath === "string" && defaultPath.length > 0 ? defaultPath : undefined,
            properties,
        };

        const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
        const result = parent ? await dialog.showOpenDialog(parent, options) : await dialog.showOpenDialog(options);

        if (result.canceled || result.filePaths.length === 0) return null;
        return result.filePaths[0];
    });

    handleIpc("app:get-info", () => ({ name: "Orbit", version: app.getVersion() }));

    handleIpc("system:open-external", async (url) => {
        if (!isAllowedExternalUrl(url)) {
            throw new Error("Orbit can only open its own documentation and repository links.");
        }
        await shell.openExternal(url);
    });

    handleIpc("system:open-local-url", async (url) => {
        if (typeof url !== "string" || !isLocalUrl(url)) {
            throw new Error("Orbit can only open local development URLs.");
        }
        await shell.openExternal(url);
    });
}
