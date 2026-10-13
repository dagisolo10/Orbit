import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Monogram } from "@/components/ui/monogram";
import { TechBadge } from "@/components/ui/tech-badge";
import { useOrbit } from "@/contexts/orbit-context";
import { useToast } from "@/contexts/toast-context";
import { useProjectActions } from "@/hooks/use-project-actions";
import { copyToClipboard } from "@/lib/clipboard";
import { shortenPath } from "@/lib/format";
import type { Project, ProjectOpenTarget, Technology } from "@/types/project";
import { Check, ChevronRight, Copy, FileCode, FolderOpen, SquareTerminal, Star, type LucideIcon } from "lucide-react";
import { useState } from "react";

const OPEN_ACTIONS: { target: ProjectOpenTarget; icon: LucideIcon; label: string }[] = [
    { target: "editor", icon: FileCode, label: "Open in editor" },
    { target: "terminal", icon: SquareTerminal, label: "Open in terminal" },
    { target: "file-manager", icon: FolderOpen, label: "Reveal in file manager" },
];

export function ProjectDetails({ project, onClose, onSelectTech }: { project: Project | null; onClose: () => void; onSelectTech: (technology: Technology) => void }) {
    const { isFavorite, toggleFavorite } = useOrbit();
    const { toast } = useToast();
    const { open } = useProjectActions();
    const [copied, setCopied] = useState(false);

    if (!project) return null;

    const favorite = isFavorite(project.path);
    const name = project.name || "Untitled project";

    const handleCopy = () => {
        void copyToClipboard(project.path).then((ok) => {
            if (ok) {
                setCopied(true);
                toast({ title: "Path copied", tone: "success" });
                setTimeout(() => setCopied(false), 1600);
            } else {
                toast({ title: "Could not copy path", tone: "error" });
            }
        });
    };

    return (
        <Modal
            open
            onClose={onClose}
            title={name}
            description={`${project.technologies.length} ${project.technologies.length === 1 ? "technology" : "technologies"} detected`}
            className="max-w-xl"
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={() => toggleFavorite(project.path)}>
                        <Star className="size-3.5" fill={favorite ? "currentColor" : "none"} />
                        {favorite ? "Remove favorite" : "Add to favorites"}
                    </Button>
                    <Button variant="secondary" size="sm" onClick={handleCopy}>
                        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
                        {copied ? "Copied" : "Copy path"}
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                <div className="flex items-center gap-3">
                    <Monogram name={name} size="lg" />
                    <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
                        <p className="truncate font-mono text-[11px] text-muted-foreground" title={project.path}>
                            {shortenPath(project.path, 64)}
                        </p>
                    </div>
                </div>

                <div>
                    <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">Technologies</p>
                    {project.technologies.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {project.technologies.map((tech) => (
                                <TechBadge key={tech.name} technology={tech} onClick={() => onSelectTech(tech)} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-[13px] text-muted-foreground">No technologies were detected in this project.</p>
                    )}
                </div>

                <div>
                    <p className="mb-2 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">Open with</p>
                    <div className="space-y-1.5">
                        {OPEN_ACTIONS.map((action) => (
                            <button
                                key={action.target}
                                type="button"
                                onClick={() => void open(project, action.target)}
                                className="flex w-full items-center gap-2.5 rounded-lg border border-white/6 bg-white/2 px-3 py-2 text-[13px] text-foreground/90 outline-none transition-colors hover:border-white/14 hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <action.icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                                <span className="flex-1 text-left">{action.label}</span>
                                <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/60" />
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </Modal>
    );
}
