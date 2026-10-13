import { useToast } from "@/contexts/toast-context";
import { openProject } from "@/services/orbit";
import type { Project, ProjectOpenTarget, Workspace } from "@/types/project";
import { useCallback } from "react";

const TARGET_LABEL: Record<ProjectOpenTarget, string> = {
    editor: "editor",
    terminal: "terminal",
    "file-manager": "file manager",
};

export function useProjectActions() {
    const { toast } = useToast();

    const openPath = useCallback(
        async (path: string, target: ProjectOpenTarget, label?: string) => {
            const result = await openProject(path, target);

            if (result.ok) {
                toast({ title: target === "file-manager" ? "Revealed in file manager" : `Opening in ${TARGET_LABEL[target]}…`, description: label, tone: "success" });
                return;
            }

            toast({ title: result.error.message, description: result.error.detail, tone: "error" });
        },
        [toast],
    );

    const open = useCallback((project: Project, target: ProjectOpenTarget) => openPath(project.path, target, project.name), [openPath]);

    const openWorkspace = useCallback((workspace: Workspace, target: ProjectOpenTarget) => openPath(workspace.path, target, workspace.name), [openPath]);

    return { open, openPath, openWorkspace };
}
