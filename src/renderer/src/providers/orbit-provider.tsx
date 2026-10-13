import { OrbitContext, type LoadStatus, type OrbitContextValue, type TechnologyStat } from "@/contexts/orbit-context";
import { useToast } from "@/contexts/toast-context";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { loadProjects, loadProjectsRoot, pickDirectory, reScanProjects, saveProjectsRoot, type OrbitError } from "@/services/orbit";
import type { OrbitSnapshot, Project, SortKey, Technology, TechnologyCategory, ViewMode, Workspace } from "@/types/project";
import type { ProjectsRootState } from "@shared/types/settings";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export function OrbitProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();

    const [status, setStatus] = useState<LoadStatus>("loading");
    const [snapshot, setSnapshot] = useState<OrbitSnapshot | null>(null);
    const [error, setError] = useState<OrbitError | null>(null);
    const [reScanning, setReScanning] = useState(false);
    const [projectsRoot, setProjectsRoot] = useState<ProjectsRootState | null>(null);
    const [changingProjectsRoot, setChangingProjectsRoot] = useState(false);
    const [query, setQuery] = useState("");
    const [activeTech, setActiveTech] = useState<Technology | null>(null);
    const [activeCategory, setActiveCategory] = useState<TechnologyCategory | null>(null);

    const [favorites, setFavorites] = useLocalStorage<string[]>("orbit.favorites", []);
    const [viewMode, setViewMode] = useLocalStorage<ViewMode>("orbit.viewMode", "grid");
    const [sortKey, setSortKey] = useLocalStorage<SortKey>("orbit.sortKey", "name-asc");

    // Prevents overlapping scans (StrictMode's double effect, rapid clicks, etc.).
    const scanInFlight = useRef(false);

    const fetchProjectsRoot = useCallback(async (): Promise<ProjectsRootState | null> => {
        const result = await loadProjectsRoot();
        if (result.ok) {
            setProjectsRoot(result.value);
            return result.value;
        }
        return null;
    }, []);

    const load = useCallback(async () => {
        if (scanInFlight.current) return;
        scanInFlight.current = true;

        setStatus("loading");
        setError(null);

        const root = await fetchProjectsRoot();

        // A configured-but-missing root is a recoverable, user-actionable state:
        // surface it directly instead of a generic scan failure.
        if (root && !root.available) {
            scanInFlight.current = false;
            setSnapshot(null);
            setError({
                code: "SCAN_FAILED",
                message: "Projects folder unavailable",
                detail: `Orbit could not access “${root.path}”. It may have been moved, renamed, or deleted. Choose another folder to continue.`,
            });
            setStatus("error");
            return;
        }

        const result = await loadProjects();
        scanInFlight.current = false;

        if (result.ok) {
            setSnapshot(result.value);
            setStatus("ready");
            return;
        }

        setSnapshot(null);
        setError(result.error);
        setStatus("error");
    }, [fetchProjectsRoot]);

    useEffect(() => {
        void load();
    }, [load]);

    const reload = useCallback(() => {
        void load();
    }, [load]);

    const changeProjectsRoot = useCallback(async () => {
        if (changingProjectsRoot || scanInFlight.current) return;
        setChangingProjectsRoot(true);

        try {
            const picked = await pickDirectory(projectsRoot?.path);

            if (!picked.ok) {
                toast({ title: picked.error.message, description: picked.error.detail, tone: "error" });
                return;
            }

            // Cancelled — leave the current selection untouched.
            if (picked.value === null) return;

            const saved = await saveProjectsRoot(picked.value);

            if (!saved.ok) {
                toast({ title: saved.error.message, description: saved.error.detail, tone: "error" });
                await fetchProjectsRoot();
                return;
            }

            setProjectsRoot(saved.value);
            toast({ title: "Projects folder updated", description: saved.value.path, tone: "success" });
            await load();
        } finally {
            setChangingProjectsRoot(false);
        }
    }, [changingProjectsRoot, fetchProjectsRoot, load, projectsRoot?.path, toast]);

    const reScan = useCallback(async () => {
        if (scanInFlight.current) return;
        scanInFlight.current = true;

        setReScanning(true);
        const result = await reScanProjects();
        scanInFlight.current = false;
        setReScanning(false);

        if (result.ok) {
            setSnapshot(result.value);
            setError(null);
            setStatus("ready");
            toast({
                title: "Re-scan complete",
                description: `${result.value.projects.length} ${result.value.projects.length === 1 ? "project" : "projects"} found.`,
                tone: "success",
            });
            return;
        }

        // Keep the last successful results on screen; surface the failure without
        // blanking the workspace or dropping out of the ready state.
        setError(result.error);
        toast({ title: result.error.message, description: result.error.detail, tone: "error" });
    }, [toast]);

    const dismissError = useCallback(() => setError(null), []);

    const toggleFavorite = useCallback(
        (path: string) => {
            setFavorites((previous) => (previous.includes(path) ? previous.filter((item) => item !== path) : [path, ...previous]));
        },
        [setFavorites],
    );

    const isFavorite = useCallback((path: string) => favorites.includes(path), [favorites]);

    const projects = useMemo<Project[]>(() => snapshot?.projects ?? [], [snapshot]);
    const workspaces = useMemo<Workspace[]>(() => snapshot?.workspaces ?? [], [snapshot]);

    // Technologies, favorites, and search operate across the whole workspace,
    // not just the standalone projects shown in All Projects.
    const allProjects = useMemo<Project[]>(() => {
        const members = workspaces.flatMap((workspace) => workspace.projects);
        return members.length > 0 ? [...projects, ...members] : projects;
    }, [projects, workspaces]);

    const technologies = useMemo<TechnologyStat[]>(() => {
        const counts = new Map<string, TechnologyStat>();
        for (const project of allProjects) {
            for (const tech of project.technologies) {
                const existing = counts.get(tech.name);
                if (existing) {
                    existing.count += 1;
                } else {
                    counts.set(tech.name, { name: tech.name, category: tech.category, count: 1 });
                }
            }
        }
        return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
    }, [allProjects]);

    const clearFilters = useCallback(() => {
        setQuery("");
        setActiveTech(null);
        setActiveCategory(null);
    }, []);

    const hasActiveFilters = query.trim().length > 0 || activeTech !== null || activeCategory !== null;

    const value = useMemo<OrbitContextValue>(
        () => ({
            status,
            error,
            query,
            reload,
            reScan,
            sortKey,
            setQuery,
            snapshot,
            projects,
            allProjects,
            workspaces,
            viewMode,
            favorites,
            activeTech,
            setSortKey,
            reScanning,
            isFavorite,
            setViewMode,
            clearFilters,
            technologies,
            projectsRoot,
            dismissError,
            setActiveTech,
            toggleFavorite,
            activeCategory,
            hasActiveFilters,
            setActiveCategory,
            changeProjectsRoot,
            changingProjectsRoot,
        }),
        [
            error,
            query,
            status,
            reload,
            reScan,
            sortKey,
            snapshot,
            projects,
            allProjects,
            workspaces,
            viewMode,
            favorites,
            isFavorite,
            setSortKey,
            reScanning,
            activeTech,
            setViewMode,
            dismissError,
            clearFilters,
            technologies,
            projectsRoot,
            toggleFavorite,
            activeCategory,
            hasActiveFilters,
            changeProjectsRoot,
            changingProjectsRoot,
        ],
    );

    return <OrbitContext.Provider value={value}>{children}</OrbitContext.Provider>;
}
