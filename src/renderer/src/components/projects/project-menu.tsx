import { Dropdown, type DropdownItem } from "@/components/ui/dropdown";
import { IconButton } from "@/components/ui/icon-button";
import { useOrbit } from "@/contexts/orbit-context";
import { useToast } from "@/contexts/toast-context";
import { useProjectActions } from "@/hooks/use-project-actions";
import { copyToClipboard } from "@/lib/clipboard";
import type { Project } from "@/types/project";
import { Copy, EllipsisVertical, FileCode, FolderOpen, Info, SquareTerminal, Star } from "lucide-react";

export function ProjectMenu({ project, onOpenDetails }: { project: Project; onOpenDetails: (project: Project) => void }) {
    const { isFavorite, toggleFavorite } = useOrbit();
    const { toast } = useToast();
    const { open } = useProjectActions();
    const favorite = isFavorite(project.path);

    const handleCopy = () => {
        void copyToClipboard(project.path).then((ok) =>
            toast({ title: ok ? "Path copied" : "Could not copy path", description: ok ? project.path : "Clipboard access was denied.", tone: ok ? "success" : "error" }),
        );
    };

    const items: DropdownItem[] = [
        { id: "details", label: "View details", icon: Info, onSelect: () => onOpenDetails(project) },
        { id: "copy", label: "Copy path", icon: Copy, onSelect: handleCopy },
        { type: "separator" },
        { id: "editor", label: "Open in editor", icon: FileCode, onSelect: () => void open(project, "editor") },
        { id: "terminal", label: "Open in terminal", icon: SquareTerminal, onSelect: () => void open(project, "terminal") },
        { id: "reveal", label: "Reveal in file manager", icon: FolderOpen, onSelect: () => void open(project, "file-manager") },
        { type: "separator" },
        { id: "favorite", label: favorite ? "Remove from favorites" : "Add to favorites", icon: Star, onSelect: () => toggleFavorite(project.path) },
    ];

    return <Dropdown items={items} label="Project actions" align="end" renderTrigger={(props) => <IconButton icon={EllipsisVertical} label="Project actions" size="sm" {...props} />} />;
}
