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
import { useState, type ReactNode } from "react";

const OPEN_ACTIONS: { target: ProjectOpenTarget; icon: LucideIcon; label: string; hint: string }[] = [
    { target: "editor", icon: FileCode, label: "Open in editor", hint: "Preferred code editor" },
    { target: "terminal", icon: SquareTerminal, label: "Open in terminal", hint: "Preferred terminal" },
    { target: "file-manager", icon: FolderOpen, label: "Reveal in file manager", hint: "System default" },
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
                        {copied ? <Check className="size-3.5 text-ok" /> : <Copy className="size-3.5" />}
                        {copied ? "Copied" : "Copy path"}
                    </Button>
                </>
            }
        >
            <div className="space-y-5">
                <div className="flex items-start gap-3 border border-line bg-panel-inset p-3">
                    <Monogram name={name} size="lg" />
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-ink">{name}</p>
                        <p className="mt-1 truncate font-mono text-[10px] text-ink-muted" title={project.path}>
                            {shortenPath(project.path, 64)}
                        </p>
                    </div>
                    <span className="shrink-0 border border-line px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-ink-muted uppercase">LOCAL</span>
                </div>

                <DetailSection label="DETECTED STACK" meta={String(project.technologies.length).padStart(2, "0")}>
                    {project.technologies.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                            {project.technologies.map((tech) => (
                                <TechBadge key={tech.name} technology={tech} onClick={() => onSelectTech(tech)} />
                            ))}
                        </div>
                    ) : (
                        <p className="font-mono text-[10px] text-ink-muted">No technologies were detected in this project.</p>
                    )}
                </DetailSection>

                <DetailSection label="LAUNCH TARGETS" meta="03">
                    <div className="divide-y divide-line-soft border-y border-line">
                        {OPEN_ACTIONS.map((action, index) => (
                            <button
                                key={action.target}
                                type="button"
                                onClick={() => void open(project, action.target)}
                                className="group flex w-full items-center gap-3 px-1 py-2.5 text-left outline-none transition-colors hover:bg-white/2.5 focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset"
                            >
                                <span className="font-mono text-[9px] tabular-nums text-ink-muted/70">{String(index + 1).padStart(2, "0")}</span>
                                <action.icon className="size-3.5 shrink-0 text-ink-muted" strokeWidth={1.75} />
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[12px] font-medium text-ink">{action.label}</span>
                                    <span className="block truncate font-mono text-[9px] text-ink-muted">{action.hint}</span>
                                </span>
                                <ChevronRight className="size-3.5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                            </button>
                        ))}
                    </div>
                </DetailSection>
            </div>
        </Modal>
    );
}

function DetailSection({ label, meta, children }: { label: string; meta: string; children: ReactNode }) {
    return (
        <section>
            <div className="mb-2 flex items-center justify-between gap-3">
                <p className="label-mono text-ink-muted">{label}</p>
                <span className="font-mono text-[9px] tabular-nums text-ink-muted/60">{meta}</span>
            </div>
            {children}
        </section>
    );
}
