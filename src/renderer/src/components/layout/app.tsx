import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { OverviewPage } from "@/components/overview/overview-page";
import { ProjectExplorer } from "@/components/projects/project-explorer";
import { ServersView } from "@/components/servers/servers-view";
import { SettingsView } from "@/components/settings/settings-view";
import { TechnologiesView } from "@/components/technologies/technologies-view";
import { WorkspacesView } from "@/components/workspaces/workspaces-view";
import { useOrbit } from "@/contexts/orbit-context";
import { useSearchHotkey } from "@/hooks/use-hot-keys";
import { cn } from "@/lib/utils";
import type { ViewId } from "@/types/navigation";
import type { Technology, TechnologyCategory } from "@/types/project";
import { useCallback, useRef, useState } from "react";

export function App() {
    const { setActiveTech, setActiveCategory } = useOrbit();
    const [view, setView] = useState<ViewId>("overview");
    const searchRef = useRef<HTMLInputElement>(null);

    useSearchHotkey(
        useCallback(() => {
            searchRef.current?.focus();
            searchRef.current?.select();
        }, []),
    );

    const handleSelectTech = useCallback(
        (technology: Technology) => {
            setActiveTech(technology);
            setView("projects");
        },
        [setActiveTech],
    );

    const handleSelectCategory = useCallback(
        (category: TechnologyCategory) => {
            setActiveCategory(category);
            setView("projects");
        },
        [setActiveCategory],
    );

    return (
        <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
            <Sidebar view={view} onNavigate={setView} />

            <div className="flex min-w-0 flex-1 flex-col">
                <Header view={view} searchRef={searchRef} />

                <main className={cn("min-h-0 flex-1", view === "servers" ? "overflow-hidden" : "overflow-y-auto")}>
                    {view === "servers" ? (
                        <ServersView />
                    ) : (
                        <div className="mx-auto w-full max-w-360 p-6">
                            {view === "overview" ? <OverviewPage onNavigate={setView} /> : null}
                            {view === "projects" ? <ProjectExplorer scope="all" /> : null}
                            {view === "workspaces" ? <WorkspacesView /> : null}
                            {view === "favorites" ? <ProjectExplorer scope="favorites" /> : null}
                            {view === "technologies" ? <TechnologiesView onSelectTech={handleSelectTech} onSelectCategory={handleSelectCategory} /> : null}
                            {view === "settings" ? <SettingsView /> : null}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
