import { TechnologyDefinition } from "@shared/types/project";

export const projectMarkers = new Set(["package.json"]);
export const skipped = new Set(["node_modules", ".next", ".expo", "dist", "out", "Git Clones"]);

export const techStack: Record<string, TechnologyDefinition> = {
    // Languages
    javascript: { packages: [], category: "language" },
    typescript: { packages: ["typescript"], category: "language" },

    // Frontend
    react: { packages: ["react"], category: "frontend" },
    next: { packages: ["next"], category: "frontend" },
    "react-native": { packages: ["react-native"], category: "frontend" },
    expo: { packages: ["expo"], category: "frontend" },

    // Backend
    node: {
        packages: ["express", "fastify", "@nestjs/core", "hono", "koa"],
        category: "backend",
    },
    express: { packages: ["express"], category: "backend" },
    nestjs: { packages: ["@nestjs/core"], category: "backend" },

    // Styling
    tailwindcss: { packages: ["tailwindcss"], category: "styling" },

    // Database / ORM
    prisma: {
        packages: ["prisma", "@prisma/client"],
        category: "database-orm",
    },
    mongoose: { packages: ["mongoose"], category: "database-orm" },
    drizzle: { packages: ["drizzle-orm"], category: "database-orm" },

    // Tools
    vite: { packages: ["vite"], category: "tools" },
    "tanstack-query": {
        packages: ["@tanstack/react-query"],
        category: "tools",
    },
    "tanstack-router": {
        packages: ["@tanstack/react-router"],
        category: "tools",
    },
    socketio: {
        packages: ["socket.io", "socket.io-client"],
        category: "tools",
    },
    electron: { packages: ["electron"], category: "tools" },
    "electron-vite": { packages: ["electron-vite"], category: "tools" },
    turborepo: { packages: ["turbo"], category: "tools" },
    bun: { packages: ["bun-types"], category: "tools" },
    jest: { packages: ["jest"], category: "tools" },
    vitest: { packages: ["vitest"], category: "tools" },
    webpack: { packages: ["webpack"], category: "tools" },
    esbuild: { packages: ["esbuild"], category: "tools" },
};
