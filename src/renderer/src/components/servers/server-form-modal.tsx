import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Monogram } from "@/components/ui/monogram";
import { Skeleton } from "@/components/ui/skeleton";
import { TechBadge } from "@/components/ui/tech-badge";
import { useOrbit } from "@/contexts/orbit-context";
import { type ServerMutationResult } from "@/contexts/servers-context";
import { filterProjectsByQuery, sortProjects } from "@/hooks/use-visible-projects";
import { getBaseName, shortenPath } from "@/lib/format";
import { cn } from "@/lib/utils";
import { pickDirectory } from "@/services/orbit";
import type { Project } from "@/types/project";
import type { ServerProject, ServerProjectDraft } from "@shared/types/server";
import { Check, FolderSearch, Search, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";

const INPUT_CLASS =
    "h-8 w-full rounded-[2px] border border-line bg-panel-inset px-2.5 text-[12px] text-ink outline-none transition-colors placeholder:text-ink-muted/70 hover:border-line-strong focus:border-accent/70 focus:bg-panel focus:ring-1 focus:ring-accent/30";

const LABEL_CLASS = "label-mono text-ink-muted";

const MAX_VISIBLE_PROJECTS = 40;

/** Add/edit dialog for a development server project. */
export function ServerFormModal({
    open,
    project,
    onClose,
    onSubmit,
}: {
    open: boolean;
    project: ServerProject | null;
    onClose: () => void;
    onSubmit: (draft: ServerProjectDraft) => Promise<ServerMutationResult>;
}) {
    const { allProjects, status } = useOrbit();
    const [name, setName] = useState("");
    const [projectPath, setProjectPath] = useState("");
    const [command, setCommand] = useState("");
    const [search, setSearch] = useState("");
    const [nameTouched, setNameTouched] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [browsing, setBrowsing] = useState(false);

    const matches = useMemo(() => sortProjects(filterProjectsByQuery(allProjects, search), "name-asc"), [allProjects, search]);
    const visibleMatches = matches.slice(0, MAX_VISIBLE_PROJECTS);
    const selectedProject = useMemo(() => allProjects.find((candidate) => candidate.path === projectPath) ?? null, [allProjects, projectPath]);
    const hasDiscoveries = allProjects.length > 0;

    const chooseProject = (candidate: Project) => {
        setProjectPath(candidate.path);
        // Selecting a discovered project fills the directory and offers its name as
        // a starting point, unless the user has already typed their own display name.
        if (!nameTouched) setName(candidate.name);
        setError(null);
    };

    const browse = async () => {
        if (browsing) return;
        setBrowsing(true);
        const result = await pickDirectory(projectPath.trim().length > 0 ? projectPath.trim() : undefined, "Select project folder");
        setBrowsing(false);

        if (!result.ok) {
            setError(result.error.message);
            return;
        }
        if (result.value === null) return;

        setProjectPath(result.value);
        // Offer a sensible default name when adding a project with no name yet.
        if (!nameTouched || name.trim().length === 0) setName(getBaseName(result.value));
        setError(null);
    };

    const submit = async () => {
        const trimmedName = name.trim();
        const trimmedPath = projectPath.trim();
        const trimmedCommand = command.trim();

        if (trimmedName.length === 0) return setError("Give this project a display name.");
        if (trimmedPath.length === 0) return setError("Choose a project folder from your workspace or browse for one.");
        if (trimmedCommand.length === 0) return setError("Enter the command that starts this server, for example “npm run dev”.");

        setSubmitting(true);
        const result = await onSubmit({ name: trimmedName, path: trimmedPath, command: trimmedCommand });
        setSubmitting(false);

        if (result.ok) onClose();
        else setError(result.message);
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            title={project ? "Edit project" : "Add project"}
            description={project ? "Update this development server's details." : "Search your Orbit workspace for a project, then set how its dev server starts."}
            className="max-w-xl"
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
                        Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => void submit()} disabled={submitting}>
                        {submitting ? "Saving…" : project ? "Save changes" : "Add project"}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <label className={LABEL_CLASS} htmlFor="server-search">
                            PROJECT
                        </label>
                        {hasDiscoveries ? <span className="font-mono text-[9px] text-ink-muted/70">{allProjects.length} DISCOVERED</span> : null}
                    </div>

                    {hasDiscoveries ? (
                        <>
                            <div className="relative">
                                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-ink-muted/70" strokeWidth={1.9} />
                                <input
                                    id="server-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search by name, path, or technology…"
                                    spellCheck={false}
                                    autoFocus={!project}
                                    autoComplete="off"
                                    className={cn(INPUT_CLASS, "pl-8")}
                                />
                            </div>

                            <div className="overflow-hidden rounded-[2px] border border-line bg-panel-inset">
                                <div className="max-h-48 overflow-y-auto p-1">
                                    {status === "loading" ? (
                                        <ProjectPickerSkeleton />
                                    ) : visibleMatches.length === 0 ? (
                                        <p className="px-3 py-6 text-center font-mono text-[10px] text-ink-muted">No discovered projects match “{search.trim()}”.</p>
                                    ) : (
                                        visibleMatches.map((candidate) => (
                                            <ProjectOption key={candidate.path} project={candidate} selected={candidate.path === projectPath} onSelect={() => chooseProject(candidate)} />
                                        ))
                                    )}
                                </div>
                                {matches.length > visibleMatches.length ? (
                                    <p className="border-t border-line px-3 py-1.5 text-center font-mono text-[9px] text-ink-muted/70">
                                        Showing {visibleMatches.length} of {matches.length} matches — keep typing to narrow down.
                                    </p>
                                ) : null}
                            </div>
                        </>
                    ) : (
                        <p className="rounded-[2px] border border-dashed border-line bg-panel-inset px-3 py-3 font-mono text-[10px] leading-relaxed text-ink-muted">
                            {status === "loading" ? "Looking for projects in your Orbit workspace…" : "Orbit hasn't discovered any projects yet. Browse for a folder to run a server from anywhere."}
                        </p>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label className={LABEL_CLASS} htmlFor="server-name">
                            DISPLAY NAME
                        </label>
                        <input
                            id="server-name"
                            value={name}
                            onChange={(event) => {
                                setNameTouched(true);
                                setName(event.target.value);
                            }}
                            onKeyDown={(event) => event.key === "Enter" && void submit()}
                            placeholder="Orbit docs"
                            spellCheck={false}
                            autoFocus={project !== null || !hasDiscoveries}
                            className={INPUT_CLASS}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className={LABEL_CLASS} htmlFor="server-command">
                            STARTUP COMMAND
                        </label>
                        <input
                            id="server-command"
                            value={command}
                            onChange={(event) => setCommand(event.target.value)}
                            onKeyDown={(event) => event.key === "Enter" && void submit()}
                            placeholder="npm run dev"
                            spellCheck={false}
                            className={cn(INPUT_CLASS, "font-mono text-[11px]")}
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className={LABEL_CLASS} htmlFor="server-path">
                        PROJECT FOLDER
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            id="server-path"
                            value={projectPath}
                            onChange={(event) => setProjectPath(event.target.value)}
                            onKeyDown={(event) => event.key === "Enter" && void submit()}
                            placeholder="/home/you/projects/docs"
                            spellCheck={false}
                            className={cn(INPUT_CLASS, "font-mono text-[11px]")}
                        />
                        <Button variant="secondary" size="sm" className="shrink-0" onClick={() => void browse()} disabled={browsing || submitting}>
                            <FolderSearch className="size-3.5" strokeWidth={1.9} />
                            {browsing ? "Opening…" : "Browse"}
                        </Button>
                    </div>
                    <p className="font-mono text-[9px] leading-relaxed text-ink-muted">
                        {selectedProject
                            ? "Selected from your workspace — Orbit already knows this project."
                            : hasDiscoveries
                              ? "Pick a discovered project above, or browse for any folder."
                              : "Browse for the folder that contains your project."}
                    </p>
                </div>

                <p className="border-t border-line pt-3 font-mono text-[9px] leading-relaxed text-ink-muted">
                    Orbit runs the startup command in the project folder. It is spawned directly — never through a shell.
                </p>

                {error ? (
                    <div className="flex items-start gap-2.5 rounded-[2px] border border-danger/30 bg-danger/6 px-3 py-2.5">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-danger" strokeWidth={1.9} />
                        <p className="text-[11px] leading-relaxed text-danger/90">{error}</p>
                    </div>
                ) : null}
            </div>
        </Modal>
    );
}

function ProjectOption({ project, selected, onSelect }: { project: Project; selected: boolean; onSelect: () => void }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className={cn(
                "flex w-full items-center gap-2.5 rounded-[1px] border-l-2 px-2 py-1.5 text-left outline-none transition-colors focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset",
                selected ? "border-accent bg-accent/8" : "border-transparent hover:bg-white/3",
            )}
        >
            <Monogram name={project.name} size="sm" />
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-ink">{project.name || "Untitled project"}</span>
                <span className="block truncate font-mono text-[9px] text-ink-muted" title={project.path}>
                    {shortenPath(project.path, 44)}
                </span>
            </span>
            <span className="hidden shrink-0 items-center gap-1 sm:flex">
                {project.technologies.slice(0, 2).map((tech) => (
                    <TechBadge key={tech.name} technology={tech} />
                ))}
            </span>
            {selected ? <Check className="size-3.5 shrink-0 text-accent" strokeWidth={2.4} /> : null}
        </button>
    );
}

function ProjectPickerSkeleton() {
    return (
        <div className="space-y-1">
            {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-center gap-2.5 px-2 py-1.5">
                    <Skeleton className="size-6 shrink-0" />
                    <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-2.5 w-32" />
                        <Skeleton className="h-2 w-44" />
                    </div>
                </div>
            ))}
        </div>
    );
}
