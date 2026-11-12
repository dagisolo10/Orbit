import type { TechnologyCategory } from "@/types/project";

export type CategoryMeta = {
    label: string;
    /** Compact form used in dense readouts. */
    short: string;
};

export const CATEGORY_ORDER: TechnologyCategory[] = ["language", "frontend", "backend", "styling", "database-orm", "tools"];

const CATEGORY_META: Record<TechnologyCategory, CategoryMeta> = {
    language: { label: "Languages", short: "LANG" },
    frontend: { label: "Frontend", short: "UI" },
    backend: { label: "Backend", short: "SRV" },
    styling: { label: "Styling", short: "CSS" },
    "database-orm": { label: "Database / ORM", short: "DB" },
    tools: { label: "Tools", short: "OPS" },
};

const FALLBACK_META: CategoryMeta = { label: "Other", short: "MISC" };

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
    vue: "Vue",
    nuxt: "Nuxt",
    svelte: "Svelte",
    sveltekit: "SvelteKit",
    angular: "Angular",
    astro: "Astro",
    solid: "SolidJS",
    preact: "Preact",
    qwik: "Qwik",
    ember: "Ember",
    remix: "Remix",
    gatsby: "Gatsby",
    alpinejs: "Alpine.js",
    htmx: "htmx",
    fastify: "Fastify",
    koa: "Koa",
    adonisjs: "AdonisJS",
    graphql: "GraphQL",
    apollo: "Apollo",
    trpc: "tRPC",
    sass: "Sass",
    less: "Less",
    postcss: "PostCSS",
    bootstrap: "Bootstrap",
    bulma: "Bulma",
    chakra: "Chakra UI",
    materialui: "Material UI",
    radix: "Radix UI",
    "styled-components": "styled-components",
    postgres: "PostgreSQL",
    mysql: "MySQL",
    sqlite: "SQLite",
    mongodb: "MongoDB",
    redis: "Redis",
    sequelize: "Sequelize",
    typeorm: "TypeORM",
    knex: "Knex",
    supabase: "Supabase",
    firebase: "Firebase",
    storybook: "Storybook",
    playwright: "Playwright",
    cypress: "Cypress",
    eslint: "ESLint",
    prettier: "Prettier",
    biome: "Biome",
    zod: "Zod",
    zustand: "Zustand",
    redux: "Redux",
    mobx: "MobX",
    recoil: "Recoil",
    axios: "Axios",
    reactrouter: "React Router",
    capacitor: "Capacitor",
    ionic: "Ionic",
    babel: "Babel",
    swc: "SWC",
    nx: "Nx",
    lerna: "Lerna",
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

function formatTechName(name: string): string {
    return name
        .split(/[-_]/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" ");
}
