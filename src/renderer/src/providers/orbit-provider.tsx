import { OrbitContext, type LoadStatus, type OrbitContextValue, type TechnologyStat } from "@/contexts/orbit-context";
import { useToast } from "@/contexts/toast-context";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { loadProjects, reScanProjects, type OrbitError } from "@/services/orbit";
import type { OrbitSnapshot, Project, SortKey, Technology, TechnologyCategory, ViewMode, Workspace } from "@/types/project";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export function OrbitProvider({ children }: { children: ReactNode }) {
    const { toast } = useToast();

    const [status, setStatus] = useState<LoadStatus>("loading");
    const [snapshot, setSnapshot] = useState<OrbitSnapshot | null>(null);
    const [error, setError] = useState<OrbitError | null>(null);
    const [reScanning, setReScanning] = useState(false);
    const [query, setQuery] = useState("");
    const [activeTech, setActiveTech] = useState<Technology | null>(null);
    const [activeCategory, setActiveCategory] = useState<TechnologyCategory | null>(null);

    const [favorites, setFavorites] = useLocalStorage<string[]>("orbit.favorites", []);
    const [viewMode, setViewMode] = useLocalStorage<ViewMode>("orbit.viewMode", "grid");
    const [sortKey, setSortKey] = useLocalStorage<SortKey>("orbit.sortKey", "name-asc");

    // Prevents overlapping scans (StrictMode's double effect, rapid clicks, etc.).
    const scanInFlight = useRef(false);

    const load = useCallback(async () => {
        if (scanInFlight.current) return;
        scanInFlight.current = true;

        setStatus("loading");
        setError(null);

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
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const reload = useCallback(() => {
        void load();
    }, [load]);

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
            dismissError,
            setActiveTech,
            toggleFavorite,
            activeCategory,
            hasActiveFilters,
            setActiveCategory,
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
            toggleFavorite,
            activeCategory,
            hasActiveFilters,
        ],
    );

    return <OrbitContext.Provider value={value}>{children}</OrbitContext.Provider>;
}
