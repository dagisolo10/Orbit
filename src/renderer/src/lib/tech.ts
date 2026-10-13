import type { TechnologyCategory } from "@/types/project";

export type CategoryMeta = {
    label: string;
    className: string;
    dotClassName: string;
};

export const CATEGORY_ORDER: TechnologyCategory[] = ["language", "frontend", "backend", "styling", "database-orm", "tools"];

export const CATEGORY_META: Record<TechnologyCategory, CategoryMeta> = {
    language: { label: "Languages", className: "text-sky-300 bg-sky-400/10 ring-sky-300/20", dotClassName: "bg-sky-400" },
    frontend: { label: "Frontend", className: "text-violet-300 bg-violet-400/10 ring-violet-300/20", dotClassName: "bg-violet-400" },
    backend: { label: "Backend", className: "text-emerald-300 bg-emerald-400/10 ring-emerald-300/20", dotClassName: "bg-emerald-400" },
    styling: { label: "Styling", className: "text-pink-300 bg-pink-400/10 ring-pink-300/20", dotClassName: "bg-pink-400" },
    "database-orm": { label: "Database / ORM", className: "text-amber-300 bg-amber-400/10 ring-amber-300/20", dotClassName: "bg-amber-400" },
    tools: { label: "Tools", className: "text-zinc-300 bg-white/5 ring-white/10", dotClassName: "bg-zinc-400" },
};

const FALLBACK_META: CategoryMeta = { label: "Other", className: "text-zinc-300 bg-white/5 ring-white/10", dotClassName: "bg-zinc-400" };

const TECH_LABELS: Record<string, string> = {
    react: "React",
    next: "Next.js",
    "next.js": "Next.js",
    nextjs: "Next.js",
    vite: "Vite",
    "react-native": "React Native",
    expo: "Expo",
    "tanstack-query": "TanStack Query",
    "tanstack-router": "TanStack Router",
    "react-query": "React Query",
    tailwindcss: "Tailwind CSS",
    tailwind: "Tailwind CSS",
    typescript: "TypeScript",
    javascript: "JavaScript",
    node: "Node.js",
    nestjs: "NestJS",
    express: "Express",
    hono: "Hono",
    prisma: "Prisma",
    drizzle: "Drizzle",
    mongoose: "Mongoose",
    socketio: "Socket.IO",
    "socket.io": "Socket.IO",
    electron: "Electron",
    "electron-vite": "electron-vite",
    tauri: "Tauri",
    jest: "Jest",
    vitest: "Vitest",
    webpack: "Webpack",
    esbuild: "esbuild",
    turborepo: "Turborepo",
    bun: "Bun",
};

export function getCategoryMeta(category: TechnologyCategory | undefined): CategoryMeta {
    if (!category) return FALLBACK_META;
    return CATEGORY_META[category] ?? FALLBACK_META;
}

export function getTechLabel(name: string): string {
    const trimmed = name.trim();
    if (!trimmed) return "Unknown";
    const known = TECH_LABELS[trimmed.toLowerCase()];
    if (known) return known;
    if (/[A-Z]|\s/.test(trimmed)) return trimmed;
    return formatTechName(trimmed);
}

export function formatTechName(name: string): string {
    return name
        .split(/[-_]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
