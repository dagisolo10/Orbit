import { useToast } from "@/contexts/toast-context";
import { openProject } from "@/services/orbit";
import type { Project, ProjectOpenTarget } from "@/types/project";
import { useCallback } from "react";

const TARGET_LABEL: Record<ProjectOpenTarget, string> = {
    editor: "editor",
    terminal: "terminal",
    "file-manager": "file manager",
};

export function useProjectActions() {
    const { toast } = useToast();

    const open = useCallback(
        async (project: Project, target: ProjectOpenTarget) => {
            const result = await openProject(project.path, target);

            if (result.ok) {
                toast({ title: target === "file-manager" ? "Revealed in file manager" : `Opening in ${TARGET_LABEL[target]}…`, description: project.name, tone: "success" });
                return;
            }

            toast({ title: result.error.message, description: result.error.detail, tone: "error" });
        },
        [toast],
    );

    return { open };
}
