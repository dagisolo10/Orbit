import { ServerManager } from "@server/manager";
import { addServerProject, readServerProjects, removeServerProject, reorderServerProjects, ServerConfigError, updateServerProject } from "@server/store";
import type { ServerEvent, ServerProject, ServerProjectDraft, ServerProjectsResult, ServerRuntimeState, ServerSnapshot } from "@shared/types/server";
import { SERVER_EVENT_CHANNEL } from "@shared/types/server";
import { BrowserWindow } from "electron";

/**
 * The single entry point the IPC layer talks to.
 *
 * Composes the persistent project store with the in-memory process manager and
 * fans runtime events out to every open window. Config mutations return the
 * fresh list plus current runtime states so callers never have to re-query.
 */
class ServerService {
    private readonly manager = new ServerManager((event) => this.broadcast(event));

    private broadcast(event: ServerEvent): void {
        for (const window of BrowserWindow.getAllWindows()) {
            if (!window.isDestroyed()) window.webContents.send(SERVER_EVENT_CHANNEL, event);
        }
    }

    async snapshot(): Promise<ServerSnapshot> {
        const projects = await readServerProjects();
        for (const project of projects) this.manager.ensureState(project.id);

        return {
            projects,
            states: projects.map((project) => this.manager.getState(project.id)),
            logs: this.manager.allLogs(),
        };
    }

    private async result(): Promise<ServerProjectsResult> {
        const projects = await readServerProjects();
        for (const project of projects) this.manager.ensureState(project.id);
        return { projects, states: projects.map((project) => this.manager.getState(project.id)) };
    }

    async add(draft: ServerProjectDraft): Promise<ServerProjectsResult> {
        await addServerProject(draft);
        return this.result();
    }

    async update(id: string, draft: ServerProjectDraft): Promise<ServerProjectsResult> {
        await updateServerProject(id, draft);
        return this.result();
    }

    async remove(id: string): Promise<ServerProjectsResult> {
        await removeServerProject(id);
        await this.manager.forget(id);
        return this.result();
    }

    async reorder(ids: string[]): Promise<ServerProjectsResult> {
        await reorderServerProjects(ids);
        return this.result();
    }

    async start(id: string): Promise<ServerRuntimeState> {
        return this.manager.start(await this.requireProject(id));
    }

    async stop(id: string): Promise<ServerRuntimeState> {
        this.manager.ensureState(id);
        return this.manager.stop(id);
    }

    async restart(id: string): Promise<ServerRuntimeState> {
        return this.manager.restart(await this.requireProject(id));
    }

    clearLogs(id: string): void {
        this.manager.clearLogs(id);
    }

    /** Stops every running server. Called on app shutdown. */
    dispose(): void {
        this.manager.dispose();
    }

    private async requireProject(id: string): Promise<ServerProject> {
        const projects = await readServerProjects();
        const project = projects.find((candidate) => candidate.id === id);
        if (!project) throw new ServerConfigError("That project no longer exists.", "NOT_FOUND");
        return project;
    }
}

export const serverService = new ServerService();
