export type ViewId = "overview" | "projects" | "servers" | "workspaces" | "technologies" | "favorites" | "settings";

export const VIEW_META: Record<ViewId, { label: string; title: string; subtitle: string }> = {
    overview: {
        label: "Overview",
        title: "Overview",
        subtitle: "Your local development workspace at a glance",
    },
    projects: {
        label: "All Projects",
        title: "All Projects",
        subtitle: "Standalone projects Orbit discovered in your workspace",
    },
    servers: {
        label: "Dev Servers",
        title: "Dev Servers",
        subtitle: "Run and monitor your local development servers",
    },
    workspaces: {
        label: "Workspaces",
        title: "Workspaces",
        subtitle: "Monorepos and multi-package workspaces in your projects",
    },
    technologies: {
        label: "Technologies",
        title: "Technologies",
        subtitle: "Browse your stack and find projects that use it",
    },
    favorites: {
        label: "Favorites",
        title: "Favorites",
        subtitle: "Projects you starred for quick access",
    },
    settings: {
        label: "Settings",
        title: "Settings",
        subtitle: "Workspace, applications, and about",
    },
};
