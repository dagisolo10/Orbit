import logo from "@/assets/logo.png";
import { LaunchPreferenceSetting, preferenceLabel } from "@/components/settings/launch-preference";
import { SettingRow, SettingSection } from "@/components/settings/setting-row";
import { Button } from "@/components/ui/button";
import { useOrbit } from "@/contexts/orbit-context";
import { useToast } from "@/contexts/toast-context";
import { pluralize } from "@/lib/format";
import { cn } from "@/lib/utils";
import { loadAppInfo, loadLaunchApps, loadLaunchPreferences, openExternal, saveLaunchPreference } from "@/services/orbit";
import type { AppInfo, LaunchAppCatalog, LaunchKind, LaunchPreference, LaunchPreferences } from "@shared/types/settings";
import { BookOpen, Code, FolderOpen, FolderSearch, FolderTree, GitBranch, Palette, RefreshCw, Terminal, TriangleAlert } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const DOCS_URL = "https://orbit.dagidev.com";
const REPO_URL = "https://github.com/dagisolo10/Orbit";

const AUTO: LaunchPreference = { mode: "auto" };

export function SettingsView() {
    const { toast } = useToast();
    const { snapshot, reScan, reScanning, status, projects, projectsRoot, changingProjectsRoot, changeProjectsRoot } = useOrbit();

    const [catalog, setCatalog] = useState<LaunchAppCatalog | null>(null);
    const [preferences, setPreferences] = useState<LaunchPreferences | null>(null);
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [savingKind, setSavingKind] = useState<LaunchKind | null>(null);

    useEffect(() => {
        let cancelled = false;

        void (async () => {
            const [appsResult, prefsResult, infoResult] = await Promise.all([loadLaunchApps(), loadLaunchPreferences(), loadAppInfo()]);
            if (cancelled) return;

            if (appsResult.ok) setCatalog(appsResult.value);
            else toast({ title: appsResult.error.message, description: appsResult.error.detail, tone: "error" });

            if (prefsResult.ok) setPreferences(prefsResult.value);
            else toast({ title: prefsResult.error.message, description: prefsResult.error.detail, tone: "error" });

            if (infoResult.ok) setAppInfo(infoResult.value);
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

    const scannerValue = status === "loading" ? "Scanning…" : status === "error" ? "Not connected" : pluralize(projects.length, "project");

    const editorOptions = catalog?.editors ?? [];
    const terminalOptions = catalog?.terminals ?? [];
    const editorPreference = preferences?.editor ?? AUTO;
    const terminalPreference = preferences?.terminal ?? AUTO;

    return (
        <div className="mx-auto max-w-3xl space-y-5">
            <SettingSection title="General" description="Where Orbit looks for projects and how it behaves.">
                <SettingRow
                    icon={FolderOpen}
                    label="Projects directory"
                    value={rootPath ?? "Not configured"}
                    mono={Boolean(rootPath)}
                    badge={
                        rootPath ? (
                            rootAvailable ? (
                                <span className="rounded-md border border-white/8 bg-white/4 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">{rootIsCustom ? "Custom" : "Default"}</span>
                            ) : (
                                <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] font-medium text-amber-300">Unavailable</span>
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
                    <div className="flex items-start gap-2.5 px-4 py-3">
                        <TriangleAlert className="mt-0.5 size-3.5 shrink-0 text-amber-300" strokeWidth={1.9} />
                        <p className="text-xs leading-relaxed text-amber-200/90">
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
                <SettingRow icon={Palette} label="Theme" value="Dark — Orbit is designed as a dark-only workspace." />
            </SettingSection>

            <SettingSection title="Applications" description="Which applications Orbit uses to open your projects.">
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
                <SettingRow icon={FolderTree} label="File manager" value="System default — Orbit reveals projects with your OS file manager." />
            </SettingSection>

            <SettingSection title="About" description="Version and links.">
                <div className="flex items-center gap-3.5 px-4 py-4">
                    <img src={logo} alt="" className="size-11 shrink-0 rounded-xl border border-white/8" />
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">{appInfo?.name ?? "Orbit"}</p>
                        <p className="text-xs text-muted-foreground">Version {appInfo?.version ?? "…"} · A local workspace for your projects</p>
                    </div>
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
        </div>
    );
}
