import type { ProjectOpenTarget, ProjectScanResult } from "./project";

type IpcHandler<ReturnType = void, Args = []> = {
    args: Args;
    return: ReturnType;
};

export type IpcHandlers = {
    "ipc:check": IpcHandler;
    "projects:scan": IpcHandler<ProjectScanResult>;
    "project:open": IpcHandler<void, [projectPath: string, target: ProjectOpenTarget]>;
};
