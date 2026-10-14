import { electronAPI } from "@electron-toolkit/preload";
import { IpcHandlers } from "@shared/types/ipc-handlers";
import { SERVER_EVENT_CHANNEL, type ServerEvent } from "@shared/types/server";
import { contextBridge, ipcRenderer, type IpcRendererEvent } from "electron";

async function invoke<Channel extends keyof IpcHandlers>(channel: Channel, ...args: IpcHandlers[Channel]["args"]): Promise<IpcHandlers[Channel]["return"]> {
    return ipcRenderer.invoke(channel, ...args).catch((err: Error) => {
        const match = err.message.match(/Error: ([^]+)$/);
        throw new Error(match ? match[1] : err.message);
    });
}

/**
 * Subscribes to development-server runtime events (status changes and log
 * lines) pushed from the main process. Returns an unsubscribe function.
 */
function onServerEvent(listener: (event: ServerEvent) => void): () => void {
    const handler = (_event: IpcRendererEvent, payload: ServerEvent) => listener(payload);
    ipcRenderer.on(SERVER_EVENT_CHANNEL, handler);
    return () => ipcRenderer.removeListener(SERVER_EVENT_CHANNEL, handler);
}

const api = {
    invoke,
    onServerEvent,
    // /** Scan the configured projects directory and return the discovered projects. */
    // scanProjects: () => invoke("projects:scan"),
    // /** Open a project in an external editor, terminal, or file manager. */
    // openProject: (projectPath: string, target: ProjectOpenTarget) => invoke("project:open", projectPath, target),
};

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld("electron", electronAPI);
        contextBridge.exposeInMainWorld("api", api);
    } catch (error) {
        console.error(error);
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI;
    // @ts-ignore (define in dts)
    window.api = api;
}
