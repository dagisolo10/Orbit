import type { ProjectOpenTarget, ProjectScanResult } from "./project";
import type { AppInfo, LaunchAppCatalog, LaunchKind, LaunchPreference, LaunchPreferences, ProjectsRootState } from "./settings";

type IpcHandler<ReturnType = void, Args = []> = {
    args: Args;
    return: ReturnType;
};

export type IpcHandlers = {
    "projects:scan": IpcHandler<ProjectScanResult>;
    "project:open": IpcHandler<void, [projectPath: string, target: ProjectOpenTarget]>;
    "launcher:list": IpcHandler<LaunchAppCatalog>;
    "settings:get-projects-root": IpcHandler<ProjectsRootState>;
    "settings:set-projects-root": IpcHandler<ProjectsRootState, [rootPath: string]>;
    "settings:get-launch-preferences": IpcHandler<LaunchPreferences>;
    "settings:set-launch-preference": IpcHandler<LaunchPreferences, [kind: LaunchKind, preference: LaunchPreference]>;
    "dialog:pick-directory": IpcHandler<string | null, [defaultPath?: string]>;
    "app:get-info": IpcHandler<AppInfo>;
    "system:open-external": IpcHandler<void, [url: string]>;
};
