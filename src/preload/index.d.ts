import { ElectronAPI } from "@electron-toolkit/preload";

import { IpcHandlers } from "../shared/types/ipc-handlers";
import type { ServerEvent } from "../shared/types/server";

declare global {
    interface Window {
        electron: ElectronAPI;
        api: {
            invoke<Channel extends keyof IpcHandlers>(channel: Channel, ...args: IpcHandlers[Channel]["args"]): Promise<IpcHandlers[Channel]["return"]> | IpcHandlers[Channel]["return"];
            onServerEvent(listener: (event: ServerEvent) => void): () => void;
        };
    }
}
