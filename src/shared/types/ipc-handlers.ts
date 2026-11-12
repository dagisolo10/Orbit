import type { ProjectOpenTarget, ProjectScanResult } from "./project";
import type { ServerProjectDraft, ServerProjectsResult, ServerRuntimeState, ServerSnapshot } from "./server";
import type { AppInfo, LaunchAppCatalog, LaunchKind, LaunchPreference, LaunchPreferences, ProjectsRootState, ScanExclusionsState } from "./settings";

type IpcHandler<ReturnType = void, Args = []> = {
    args: Args;
    return: ReturnType;
};

export type IpcHandlers = {
    "app:get-info": IpcHandler<AppInfo>;
    "launcher:list": IpcHandler<LaunchAppCatalog>;
    "dialog:pick-directory": IpcHandler<string | null, [defaultPath?: string, title?: string]>;

    "system:open-external": IpcHandler<void, [url: string]>;
    "system:open-local-url": IpcHandler<void, [url: string]>;

    "projects:scan": IpcHandler<ProjectScanResult>;
    "project:open": IpcHandler<void, [projectPath: string, target: ProjectOpenTarget]>;

    "settings:get-projects-root": IpcHandler<ProjectsRootState>;
    "settings:get-scan-exclusions": IpcHandler<ScanExclusionsState>;
    "settings:get-launch-preferences": IpcHandler<LaunchPreferences>;
    "settings:set-projects-root": IpcHandler<ProjectsRootState, [rootPath: string]>;
    "settings:add-scan-exclusion": IpcHandler<ScanExclusionsState, [target: string]>;
    "settings:remove-scan-exclusion": IpcHandler<ScanExclusionsState, [target: string]>;
    "settings:set-launch-preference": IpcHandler<LaunchPreferences, [kind: LaunchKind, preference: LaunchPreference]>;

    "servers:list": IpcHandler<ServerSnapshot>;
    "servers:clear-logs": IpcHandler<void, [id: string]>;
    "servers:stop": IpcHandler<ServerRuntimeState, [id: string]>;
    "servers:start": IpcHandler<ServerRuntimeState, [id: string]>;
    "servers:restart": IpcHandler<ServerRuntimeState, [id: string]>;
    "servers:remove": IpcHandler<ServerProjectsResult, [id: string]>;
    "servers:reorder": IpcHandler<ServerProjectsResult, [ids: string[]]>;
    "servers:add": IpcHandler<ServerProjectsResult, [draft: ServerProjectDraft]>;
    "servers:update": IpcHandler<ServerProjectsResult, [id: string, draft: ServerProjectDraft]>;
};
