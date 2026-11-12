import logo from "@/assets/logo.png";
import { LaunchPreferenceSetting, preferenceLabel } from "@/components/settings/launch-preference";
import { SettingRow, SettingSection } from "@/components/settings/setting-row";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { useInterfaceScale } from "@/contexts/interface-scale-context";
import { useOrbit } from "@/contexts/orbit-context";
import { useToast } from "@/contexts/toast-context";
import { pluralize, shortenPath } from "@/lib/format";
import { cn } from "@/lib/utils";
import { addScanExclusion, loadAppInfo, loadLaunchApps, loadLaunchPreferences, loadScanExclusions, openExternal, pickDirectory, removeScanExclusion, saveLaunchPreference } from "@/services/orbit";
import { VIEW_META } from "@/types/navigation";
import type { AppInfo, LaunchAppCatalog, LaunchKind, LaunchPreference, LaunchPreferences, ScanExclusionsState } from "@shared/types/settings";
import {
    BookOpen,
    ChevronRight,
    Code,
    FolderMinus,
    FolderOpen,
    FolderPlus,
    FolderSearch,
    FolderTree,
    FolderX,
    GitBranch,
    Minus,
    Palette,
    Plus,
    RefreshCw,
    RotateCcw,
    Scaling,
    ShieldX,
    Terminal,
    TriangleAlert,
    X,
} from "lucide-react";
import { useCallback, useEffect, useState, type KeyboardEvent } from "react";

const DOCS_URL = "https://orbit.dagidev.com";
const REPO_URL = "https://github.com/dagisolo10/Orbit";

const AUTO: LaunchPreference = { mode: "auto" };

const SECTIONS = [
    { id: "general", index: "01", label: "General", meta: "DIRECTORY / SCAN" },
    { id: "applications", index: "02", label: "Applications", meta: "LAUNCH TARGETS" },
    { id: "about", index: "03", label: "About", meta: "APPLICATION" },
] as const;

type SettingsSectionId = (typeof SECTIONS)[number]["id"];

export function SettingsView() {
    const { toast } = useToast();
    const { snapshot, reScan, reScanning, status, projects, projectsRoot, changingProjectsRoot, changeProjectsRoot } = useOrbit();
    const { scale, canIncrease, canDecrease, increase, decrease, reset: resetScale } = useInterfaceScale();

    const [activeSection, setActiveSection] = useState<SettingsSectionId>("general");
    const [catalog, setCatalog] = useState<LaunchAppCatalog | null>(null);
    const [preferences, setPreferences] = useState<LaunchPreferences | null>(null);
    const [exclusions, setExclusions] = useState<ScanExclusionsState | null>(null);
    const [exclusionsOpen, setExclusionsOpen] = useState(false);
    const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [savingKind, setSavingKind] = useState<LaunchKind | null>(null);
    const [savingExclusion, setSavingExclusion] = useState(false);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const [appsResult, prefsResult, infoResult, exclusionsResult] = await Promise.all([loadLaunchApps(), loadLaunchPreferences(), loadAppInfo(), loadScanExclusions()]);
            if (cancelled) return;

            if (appsResult.ok) setCatalog(appsResult.value);
            else toast({ title: appsResult.error.message, description: appsResult.error.detail, tone: "error" });

            if (prefsResult.ok) setPreferences(prefsResult.value);
            else toast({ title: prefsResult.error.message, description: prefsResult.error.detail, tone: "error" });

            if (infoResult.ok) setAppInfo(infoResult.value);

            if (exclusionsResult.ok) setExclusions(exclusionsResult.value);
            else toast({ title: exclusionsResult.error.message, description: exclusionsResult.error.detail, tone: "error" });
        })();

        return () => {
            cancelled = true;
        };
    }, [toast]);

    const changePreference = useCallback(
        async (kind: LaunchKind, preference: LaunchPreference): Promise<boolean> => {
            setSavingKind(kind);
            const result = await saveLaunchPreference(kind, preference);
            setSavingKind(null);

            if (!result.ok) {
                toast({ title: result.error.message, description: result.error.detail, tone: "error" });
                return false;
            }

            setPreferences(result.value);
            const options = kind === "editor" ? (catalog?.editors ?? []) : (catalog?.terminals ?? []);
            toast({ title: kind === "editor" ? "Editor preference updated" : "Terminal preference updated", description: preferenceLabel(preference, options), tone: "success" });
            return true;
        },
        [catalog, toast],
    );

    const openLink = useCallback(
        async (url: string) => {
            const result = await openExternal(url);
            if (!result.ok) toast({ title: result.error.message, description: result.error.detail, tone: "error" });
        },
        [toast],
    );

    const rootPath = projectsRoot?.path ?? snapshot?.rootPath ?? null;
    const rootAvailable = projectsRoot ? projectsRoot.available : Boolean(snapshot?.rootPath);
    const rootIsCustom = projectsRoot?.isCustom ?? false;

    const addExclusion = useCallback(async () => {
        if (savingExclusion) return;
        setSavingExclusion(true);

        try {
            const picked = await pickDirectory(rootPath ?? undefined, "Choose a folder to exclude from scans");

            if (!picked.ok) {
                toast({ title: picked.error.message, description: picked.error.detail, tone: "error" });
                return;
            }

            if (picked.value === null) return;

            const result = await addScanExclusion(picked.value);

            if (!result.ok) {
                toast({ title: result.error.message, description: result.error.detail, tone: "error" });
                return;
            }

            setExclusions(result.value);
            setExclusionsOpen(true);
            toast({ title: "Folder excluded", description: picked.value, tone: "success" });
            reScan();
        } finally {
            setSavingExclusion(false);
        }
    }, [reScan, rootPath, savingExclusion, toast]);

    const removeExclusion = useCallback(
        async (target: string): Promise<boolean> => {
            if (savingExclusion) return false;
            setSavingExclusion(true);

            const result = await removeScanExclusion(target);
            setSavingExclusion(false);

            if (!result.ok) {
                toast({ title: result.error.message, description: result.error.detail, tone: "error" });
                return false;
            }

            setExclusions(result.value);
            if (result.value.paths.length === 0) setExclusionsOpen(false);
            toast({ title: "Folder included again", description: target, tone: "success" });
            reScan();
            return true;
        },
        [reScan, savingExclusion, toast],
    );

    const scannerValue = status === "loading" ? "Scanning…" : status === "error" ? "Not connected" : pluralize(projects.length, "project");

    const editorOptions = catalog?.editors ?? [];
    const terminalOptions = catalog?.terminals ?? [];
    const editorPreference = preferences?.editor ?? AUTO;
    const terminalPreference = preferences?.terminal ?? AUTO;

    const meta = VIEW_META.settings;

    const moveTab = (event: KeyboardEvent<HTMLButtonElement>, position: number) => {
        let next: number | null = null;
        if (event.key === "ArrowRight") next = (position + 1) % SECTIONS.length;
        else if (event.key === "ArrowLeft") next = (position - 1 + SECTIONS.length) % SECTIONS.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = SECTIONS.length - 1;
        if (next === null) return;

        event.preventDefault();
        setActiveSection(SECTIONS[next].id);
        const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
        tabs?.[next]?.focus();
    };

    return (
        <div className="space-y-5">
            <PageHeader section={meta.section} index={meta.index} title={meta.title} description={meta.subtitle} />

            <nav role="tablist" aria-label="Settings sections" className="flex items-stretch overflow-x-auto border-y border-line bg-panel-inset scrollbar-none [&::-webkit-scrollbar]:hidden">
                {SECTIONS.map((section, position) => {
                    const active = activeSection === section.id;
                    return (
                        <button
                            key={section.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() => setActiveSection(section.id)}
                            onKeyDown={(event) => moveTab(event, position)}
                            className={cn(
                                "group relative flex h-10 shrink-0 items-center gap-2 border-r border-line px-4 text-[12px] outline-none transition-colors focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-inset",
                                active ? "bg-panel-raised text-ink" : "text-ink-soft hover:bg-panel/70 hover:text-ink",
                            )}
                        >
                            <span className={cn("font-mono text-[9px] tabular-nums", active ? "text-accent" : "text-ink-muted/70")}>{section.index}</span>
                            <span className="font-medium whitespace-nowrap">{section.label}</span>
                            <span className="hidden font-mono text-[8px] tracking-[0.12em] text-ink-muted/50 uppercase xl:inline">{section.meta}</span>
                            {active ? <span aria-hidden className="absolute inset-x-0 bottom-0 h-0.5 bg-accent" /> : null}
                        </button>
                    );
                })}

                <div className="ml-auto hidden shrink-0 items-center gap-3 px-4 font-mono text-[9px] tracking-[0.08em] text-ink-muted uppercase lg:flex">
                    <span className="flex items-center gap-1.5">
                        <span className="text-ink-muted/60">VER</span>
                        <span className="text-ink-soft tabular-nums">{appInfo?.version ?? "—"}</span>
                    </span>
                    <span aria-hidden className="h-3 w-px bg-line" />
                    <span className="flex items-center gap-1.5">
                        <span aria-hidden className={cn("size-1.5 shrink-0 rounded-[1px]", rootAvailable ? "bg-ok" : "bg-warn")} />
                        <span className={cn(rootAvailable ? "text-ok" : "text-warn")}>{rootAvailable ? "ROOT ONLINE" : "ROOT OFFLINE"}</span>
                    </span>
                    <span aria-hidden className="h-3 w-px bg-line" />
                    <span className="flex items-center gap-1.5">
                        <span className="text-ink-muted/60">SCANNER</span>
                        <span className={cn(status === "error" ? "text-danger" : status === "loading" ? "text-warn" : "text-ok")}>
                            {status === "error" ? "DEGRADED" : status === "loading" ? "SCANNING" : "READY"}
                        </span>
                    </span>
                </div>
            </nav>

            <div key={activeSection} role="tabpanel" className="animate-rise min-w-0">
                {activeSection === "general" ? (
                    <SettingSection id="settings-general" description="Where Orbit looks for projects and how it behaves.">
                        <SettingRow
                            icon={FolderOpen}
                            label="Projects directory"
                            value={rootPath ?? "Not configured"}
                            mono={Boolean(rootPath)}
                            badge={
                                rootPath ? (
                                    rootAvailable ? (
                                        <span className="rounded-[1px] border border-line bg-panel-inset px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-ink-muted uppercase">
                                            {rootIsCustom ? "Custom" : "Default"}
                                        </span>
                                    ) : (
                                        <span className="rounded-[1px] border border-warn/30 bg-warn/10 px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-warn uppercase">Unavailable</span>
                                    )
                                ) : null
                            }
                            action={
                                <Button variant="secondary" size="sm" onClick={changeProjectsRoot} disabled={changingProjectsRoot}>
                                    <FolderSearch className={cn("size-3.5", changingProjectsRoot && "animate-pulse")} />
                                    {changingProjectsRoot ? "Opening…" : "Change folder"}
                                </Button>
                            }
                        />
                        {rootPath && !rootAvailable ? (
                            <div className="flex items-start gap-2.5 py-3">
                                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-warn" strokeWidth={1.9} />
                                <p className="text-[11px] leading-relaxed text-warn/90">
                                    Orbit could not access this folder. It may have been moved, renamed, or deleted. Choose another folder to keep scanning your projects.
                                </p>
                            </div>
                        ) : null}
                        <SettingRow
                            icon={RefreshCw}
                            label="Project scan"
                            value={scannerValue}
                            action={
                                <Button variant="secondary" size="sm" onClick={reScan} disabled={reScanning}>
                                    <RefreshCw className={cn("size-3.5", reScanning && "animate-spin")} />
                                    {reScanning ? "Scanning…" : "Re-scan"}
                                </Button>
                            }
                        />
                        <SettingRow
                            icon={FolderX}
                            label="Scan exclusions"
                            value={exclusions === null ? "Loading excluded folders…" : "Folders Orbit skips while scanning. Built-in names like node_modules are always ignored."}
                            action={
                                <Button variant="secondary" size="sm" onClick={() => void addExclusion()} disabled={savingExclusion || exclusions === null}>
                                    <Plus className={cn("size-3.5", savingExclusion && "animate-pulse")} />
                                    {savingExclusion ? "Saving…" : "Add folder"}
                                </Button>
                            }
                        />
                        {exclusions && exclusions.paths.length > 0 ? (
                            <button
                                type="button"
                                aria-expanded={exclusionsOpen}
                                onClick={() => setExclusionsOpen((open) => !open)}
                                className="grid w-full grid-cols-[16px_minmax(0,1fr)_auto] items-center gap-3 py-3 text-left transition-colors hover:bg-panel-inset/40"
                            >
                                <ChevronRight className={cn("size-3.5 text-ink-muted duration-200 transition-transform", exclusionsOpen && "rotate-90")} strokeWidth={1.75} />
                                <div className="min-w-0">
                                    <p className="text-[12px] font-medium text-ink">Excluded folders</p>
                                    <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                                        {exclusionsOpen ? "Hide the folders excluded from scans." : `Show ${pluralize(exclusions.paths.length, "excluded folder")}.`}
                                    </p>
                                </div>
                                <span className="shrink-0 rounded-[2px] border border-line bg-panel-inset px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-ink-muted">
                                    {exclusions.paths.length}
                                </span>
                            </button>
                        ) : null}
                        <div className="ml-8">
                            {exclusionsOpen
                                ? exclusions?.paths.map((excludedPath) => (
                                      <SettingRow
                                          key={excludedPath}
                                          icon={FolderMinus}
                                          label={folderName(excludedPath)}
                                          value={shortenPath(excludedPath, 88)}
                                          mono
                                          action={
                                              <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  className="px-1.5"
                                                  disabled={savingExclusion}
                                                  onClick={() => setPendingRemoval(excludedPath)}
                                                  title={`Include ${folderName(excludedPath)} in scans`}
                                                  aria-label={`Include ${folderName(excludedPath)} in scans`}
                                              >
                                                  <X className="size-3.5" />
                                              </Button>
                                          }
                                      />
                                  ))
                                : null}
                        </div>
                        {exclusions ? <SettingRow icon={ShieldX} label="Built-in exclusions" value={exclusions.predefined.join(", ")} mono /> : null}
                        <SettingRow
                            icon={Scaling}
                            label="Interface scale"
                            value={`${Math.round(scale * 100)}% — native zoom for the entire interface · Shift + + - 0`}
                            action={
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="subtle"
                                        size="sm"
                                        onClick={decrease}
                                        disabled={!canDecrease}
                                        aria-label="Decrease interface scale"
                                        title="Decrease interface scale (Shift + -)"
                                        className="px-1.5"
                                    >
                                        <Minus className="size-3.5" />
                                    </Button>
                                    <span className="inline-flex h-7 min-w-12 items-center justify-center rounded-[2px] border border-line bg-panel-inset px-2 font-mono text-[11px] tabular-nums text-ink-soft">
                                        {Math.round(scale * 100)}%
                                    </span>
                                    <Button
                                        variant="subtle"
                                        size="sm"
                                        onClick={increase}
                                        disabled={!canIncrease}
                                        aria-label="Increase interface scale"
                                        title="Increase interface scale (Shift + +)"
                                        className="px-1.5"
                                    >
                                        <Plus className="size-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={resetScale}
                                        disabled={scale === 1}
                                        aria-label="Reset interface scale"
                                        title="Reset interface scale (Shift + 0)"
                                        className="px-1.5"
                                    >
                                        <RotateCcw className="size-3.5" />
                                    </Button>
                                </div>
                            }
                        />
                        <SettingRow
                            icon={Palette}
                            label="Theme"
                            value="Dark — Orbit is designed as a dark-only workspace."
                            badge={<span className="rounded-[1px] border border-line bg-panel-inset px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-ink-muted uppercase">Locked</span>}
                        />
                    </SettingSection>
                ) : null}

                {activeSection === "applications" ? (
                    <SettingSection id="settings-applications" description="Which applications Orbit uses to open your projects.">
                        <LaunchPreferenceSetting
                            icon={Code}
                            label="Code editor"
                            kind="editor"
                            options={editorOptions}
                            preference={editorPreference}
                            saving={savingKind === "editor"}
                            onChange={(preference) => changePreference("editor", preference)}
                        />
                        <LaunchPreferenceSetting
                            icon={Terminal}
                            label="Terminal"
                            kind="terminal"
                            options={terminalOptions}
                            preference={terminalPreference}
                            saving={savingKind === "terminal"}
                            onChange={(preference) => changePreference("terminal", preference)}
                        />
                        <SettingRow
                            icon={FolderTree}
                            label="File manager"
                            value="System default — Orbit reveals projects with your OS file manager."
                            badge={<span className="rounded-[1px] border border-line bg-panel-inset px-1.5 py-0.5 font-mono text-[9px] tracking-widest text-ink-muted uppercase">System</span>}
                        />
                    </SettingSection>
                ) : null}

                {activeSection === "about" ? (
                    <SettingSection id="settings-about" description="Version, identity, and links.">
                        <div className="flex items-center gap-3 py-4">
                            <span className="inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-[2px] border border-line bg-bg">
                                <img src={logo} alt="Orbit" className="size-full object-cover" draggable={false} />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold text-ink">{appInfo?.name ?? "Orbit"}</p>
                                <p className="mt-0.5 font-mono text-[9.5px] text-ink-muted">Version {appInfo?.version ?? "…"} · A local workspace for your projects</p>
                            </div>
                            <span className="shrink-0 rounded-[1px] border border-line bg-panel-inset px-1.5 py-0.5 font-mono text-[9px] tracking-[0.12em] text-ink-muted uppercase">Local</span>
                        </div>
                        <SettingRow
                            icon={BookOpen}
                            label="Documentation"
                            value="orbit.dagidev.com"
                            action={
                                <Button variant="secondary" size="sm" onClick={() => void openLink(DOCS_URL)}>
                                    Open
                                </Button>
                            }
                        />
                        <SettingRow
                            icon={GitBranch}
                            label="Source code"
                            value="github.com/dagisolo10/Orbit"
                            action={
                                <Button variant="secondary" size="sm" onClick={() => void openLink(REPO_URL)}>
                                    Open
                                </Button>
                            }
                        />
                    </SettingSection>
                ) : null}
            </div>

            <RemoveExclusionModal
                target={pendingRemoval}
                onClose={() => setPendingRemoval(null)}
                onConfirm={async () => {
                    if (!pendingRemoval) return false;
                    return removeExclusion(pendingRemoval);
                }}
            />
        </div>
    );
}

function RemoveExclusionModal({ target, onClose, onConfirm }: { target: string | null; onClose: () => void; onConfirm: () => Promise<boolean> }) {
    const [removing, setRemoving] = useState(false);

    const confirm = async () => {
        setRemoving(true);
        const removed = await onConfirm();
        setRemoving(false);
        if (removed) onClose();
    };

    return (
        <Modal
            open={target !== null}
            onClose={onClose}
            title="Include folder in scans"
            description={target ? `Scan “${folderName(target)}” again?` : undefined}
            footer={
                <>
                    <Button variant="ghost" size="sm" onClick={onClose} disabled={removing}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={() => void confirm()} disabled={removing}>
                        <FolderPlus className="size-3.5" />
                        {removing ? "Including…" : "Include folder"}
                    </Button>
                </>
            }
        >
            <div className="flex items-start gap-2.5 border border-line bg-panel-inset px-3 py-2.5">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-ink-muted" strokeWidth={1.9} />
                <p className="text-[12px] leading-relaxed text-ink-soft">
                    Orbit will include this folder in the next scan. That can take longer and surface projects you previously hid.
                </p>
            </div>
        </Modal>
    );
}

function folderName(target: string): string {
    return target.split(/[\\/]/).filter(Boolean).pop() ?? target;
}
