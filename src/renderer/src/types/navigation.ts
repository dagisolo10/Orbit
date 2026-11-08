export type ViewId = "overview" | "projects" | "servers" | "workspaces" | "technologies" | "favorites" | "settings";

export type ViewMeta = {
    /** Short label used in the channel navigation. */
    label: string;
    /** Full page title. */
    title: string;
    /** Supporting sentence under the title. */
    subtitle: string;
    /** Two-digit channel index. */
    index: string;
    /** Uppercase section name used in the page eyebrow. */
    section: string;
};

export const VIEW_META: Record<ViewId, ViewMeta> = {
    overview: {
        label: "Overview",
        title: "Workspace overview",
        subtitle: "A live readout of the projects, stacks, and workspaces Orbit has indexed.",
        index: "00",
        section: "OVERVIEW",
    },
    projects: {
        label: "Projects",
        title: "Project index",
        subtitle: "Every standalone project discovered under your configured workspace root.",
        index: "01",
        section: "PROJECTS",
    },
    workspaces: {
        label: "Workspaces",
        title: "Workspace groups",
        subtitle: "Monorepos and multi-package roots, with their member projects grouped together.",
        index: "02",
        section: "WORKSPACES",
    },
    technologies: {
        label: "Technologies",
        title: "Stack index",
        subtitle: "Technologies detected from package manifests, grouped by role and ranked by usage.",
        index: "03",
        section: "TECHNOLOGIES",
    },
    favorites: {
        label: "Favorites",
        title: "Pinned projects",
        subtitle: "Projects you have starred for fast access from anywhere in the workspace.",
        index: "04",
        section: "FAVORITES",
    },
    servers: {
        label: "Dev Servers",
        title: "Development servers",
        subtitle: "Run, watch, and open your local development servers without leaving Orbit.",
        index: "05",
        section: "DEV SERVERS",
    },
    settings: {
        label: "Settings",
        title: "Settings",
        subtitle: "Workspace root, launch applications, and application information.",
        index: "06",
        section: "SETTINGS",
    },
};
