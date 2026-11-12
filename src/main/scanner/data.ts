import { TechnologyDefinition } from "@shared/types/project";

export const projectMarkers = new Set(["package.json"]);
export const skipped = new Set(["node_modules", ".next", ".vscode", ".cursor", ".git", ".expo", "dist", "out", ".turbo", ".fallow"]);

export const techStack: Record<string, TechnologyDefinition> = {
    // Languages
    javascript: { packages: [], category: "language" },
    typescript: { packages: ["typescript"], category: "language" },

    // Frontend
    react: { packages: ["react"], category: "frontend" },
    next: { packages: ["next"], category: "frontend" },
    "react-native": { packages: ["react-native"], category: "frontend" },
    expo: { packages: ["expo"], category: "frontend" },
    vue: { packages: ["vue"], category: "frontend" },
    nuxt: { packages: ["nuxt", "nuxt3"], category: "frontend" },
    svelte: { packages: ["svelte"], category: "frontend" },
    sveltekit: { packages: ["@sveltejs/kit"], category: "frontend" },
    angular: { packages: ["@angular/core"], category: "frontend" },
    astro: { packages: ["astro"], category: "frontend" },
    solid: { packages: ["solid-js"], category: "frontend" },
    preact: { packages: ["preact"], category: "frontend" },
    qwik: { packages: ["@builder.io/qwik"], category: "frontend" },
    ember: { packages: ["ember-source"], category: "frontend" },
    remix: { packages: ["@remix-run/react", "@remix-run/node"], category: "frontend" },
    gatsby: { packages: ["gatsby"], category: "frontend" },
    alpinejs: { packages: ["alpinejs"], category: "frontend" },
    htmx: { packages: ["htmx.org"], category: "frontend" },

    // Backend
    node: {
        packages: ["express", "fastify", "@nestjs/core", "@nestjs/common", "@knitjs/core", "@knitjs/common", "hono", "koa"],
        category: "backend",
    },
    express: { packages: ["express"], category: "backend" },
    nestjs: { packages: ["@nestjs/core", "@nestjs/common", "@knitjs/core", "@knitjs/common"], category: "backend" },
    fastify: { packages: ["fastify"], category: "backend" },
    hono: { packages: ["hono"], category: "backend" },
    koa: { packages: ["koa"], category: "backend" },
    adonisjs: { packages: ["@adonisjs/core"], category: "backend" },
    graphql: { packages: ["graphql"], category: "backend" },
    apollo: { packages: ["@apollo/client", "@apollo/server"], category: "backend" },
    trpc: { packages: ["@trpc/server", "@trpc/client"], category: "backend" },

    // Styling
    tailwindcss: { packages: ["tailwindcss"], category: "styling" },
    sass: { packages: ["sass", "node-sass"], category: "styling" },
    less: { packages: ["less"], category: "styling" },
    postcss: { packages: ["postcss"], category: "styling" },
    bootstrap: { packages: ["bootstrap"], category: "styling" },
    bulma: { packages: ["bulma"], category: "styling" },
    chakra: { packages: ["@chakra-ui/react"], category: "styling" },
    materialui: { packages: ["@mui/material"], category: "styling" },
    radix: {
        packages: ["@radix-ui/react-slot", "@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
        category: "styling",
    },
    "styled-components": { packages: ["styled-components"], category: "styling" },

    // Database / ORM
    prisma: {
        packages: ["prisma", "@prisma/client"],
        category: "database-orm",
    },
    mongoose: { packages: ["mongoose"], category: "database-orm" },
    drizzle: { packages: ["drizzle-orm"], category: "database-orm" },
    postgres: { packages: ["pg", "postgres"], category: "database-orm" },
    mysql: { packages: ["mysql", "mysql2"], category: "database-orm" },
    sqlite: { packages: ["sqlite3", "better-sqlite3"], category: "database-orm" },
    mongodb: { packages: ["mongodb"], category: "database-orm" },
    redis: { packages: ["redis", "ioredis"], category: "database-orm" },
    sequelize: { packages: ["sequelize"], category: "database-orm" },
    typeorm: { packages: ["typeorm"], category: "database-orm" },
    knex: { packages: ["knex"], category: "database-orm" },
    supabase: { packages: ["@supabase/supabase-js"], category: "database-orm" },
    firebase: { packages: ["firebase", "firebase-admin"], category: "database-orm" },

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
    storybook: { packages: ["storybook", "@storybook/react", "@storybook/react-vite"], category: "tools" },
    playwright: { packages: ["@playwright/test", "playwright"], category: "tools" },
    cypress: { packages: ["cypress"], category: "tools" },
    eslint: { packages: ["eslint"], category: "tools" },
    prettier: { packages: ["prettier"], category: "tools" },
    biome: { packages: ["@biomejs/biome"], category: "tools" },
    zod: { packages: ["zod"], category: "tools" },
    zustand: { packages: ["zustand"], category: "tools" },
    redux: { packages: ["redux", "@reduxjs/toolkit"], category: "tools" },
    mobx: { packages: ["mobx", "mobx-react", "mobx-react-lite"], category: "tools" },
    recoil: { packages: ["recoil"], category: "tools" },
    axios: { packages: ["axios"], category: "tools" },
    reactrouter: { packages: ["react-router", "react-router-dom"], category: "tools" },
    tauri: { packages: ["@tauri-apps/api", "@tauri-apps/cli"], category: "tools" },
    capacitor: { packages: ["@capacitor/core"], category: "tools" },
    ionic: { packages: ["@ionic/react", "@ionic/core"], category: "tools" },
    babel: { packages: ["@babel/core"], category: "tools" },
    swc: { packages: ["@swc/core"], category: "tools" },
    nx: { packages: ["nx"], category: "tools" },
    lerna: { packages: ["lerna"], category: "tools" },
};
