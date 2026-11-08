import { Dropdown, type DropdownItem } from "@/components/ui/dropdown";
import { IconButton } from "@/components/ui/icon-button";
import { useToast } from "@/contexts/toast-context";
import { useProjectActions } from "@/hooks/use-project-actions";
import { copyToClipboard } from "@/lib/clipboard";
import { shortenPath } from "@/lib/format";
import type { Workspace } from "@/types/project";
import { Copy, EllipsisVertical, FileCode, FolderOpen, SquareTerminal } from "lucide-react";

export function WorkspaceMenu({ workspace }: { workspace: Workspace }) {
    const { toast } = useToast();
    const { openWorkspace } = useProjectActions();

    const handleCopy = () => {
        void copyToClipboard(workspace.path).then((ok) =>
            toast({ title: ok ? "Path copied" : "Could not copy path", description: ok ? workspace.path : "Clipboard access was denied.", tone: ok ? "success" : "error" }),
        );
    };

    const items: DropdownItem[] = [
        { id: "editor", label: "Open in editor", icon: FileCode, onSelect: () => void openWorkspace(workspace, "editor") },
        { id: "terminal", label: "Open in terminal", icon: SquareTerminal, onSelect: () => void openWorkspace(workspace, "terminal") },
        { id: "reveal", label: "Reveal in file manager", icon: FolderOpen, onSelect: () => void openWorkspace(workspace, "file-manager") },
        { type: "separator" },
        { id: "copy", label: "Copy path", icon: Copy, onSelect: handleCopy },
    ];

    return (
        <Dropdown
            items={items}
            label="Workspace actions"
            align="end"
            header={
                <div className="border-b border-line px-2.5 pt-1.5 pb-2">
                    <p className="truncate text-[12px] font-medium text-ink">{workspace.name}</p>
                    <p className="mt-0.5 truncate font-mono text-[9px] text-ink-muted" title={workspace.path}>
                        {shortenPath(workspace.path, 38)}
                    </p>
                </div>
            }
            renderTrigger={(props) => <IconButton icon={EllipsisVertical} label="Workspace actions" size="sm" {...props} />}
        />
    );
}
