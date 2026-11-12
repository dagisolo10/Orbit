import adonisjs from "devicon/icons/adonisjs/adonisjs-original.svg";
import alpinejs from "devicon/icons/alpinejs/alpinejs-original.svg";
import angular from "devicon/icons/angular/angular-original.svg";
import apollographql from "devicon/icons/apollographql/apollographql-original.svg";
import astro from "devicon/icons/astro/astro-original.svg";
import axios from "devicon/icons/axios/axios-plain.svg";
import babel from "devicon/icons/babel/babel-original.svg";
import biome from "devicon/icons/biome/biome-original.svg";
import bootstrap from "devicon/icons/bootstrap/bootstrap-original.svg";
import bulma from "devicon/icons/bulma/bulma-plain.svg";
import bun from "devicon/icons/bun/bun-original.svg";
import capacitor from "devicon/icons/capacitor/capacitor-original.svg";
import chakraui from "devicon/icons/chakraui/chakraui-original.svg";
import electron from "devicon/icons/electron/electron-original.svg";
import ember from "devicon/icons/ember/ember-original.svg";
import eslint from "devicon/icons/eslint/eslint-original.svg";
import expo from "devicon/icons/expo/expo-original.svg";
import express from "devicon/icons/express/express-original.svg";
import fastify from "devicon/icons/fastify/fastify-original.svg";
import firebase from "devicon/icons/firebase/firebase-original.svg";
import gatsby from "devicon/icons/gatsby/gatsby-original.svg";
import graphql from "devicon/icons/graphql/graphql-plain.svg";
import htmx from "devicon/icons/htmx/htmx-original.svg";
import ionic from "devicon/icons/ionic/ionic-original.svg";
import javascript from "devicon/icons/javascript/javascript-original.svg";
import jest from "devicon/icons/jest/jest-plain.svg";
import knexjs from "devicon/icons/knexjs/knexjs-original.svg";
import materialui from "devicon/icons/materialui/materialui-original.svg";
import mobx from "devicon/icons/mobx/mobx-original.svg";
import mongodb from "devicon/icons/mongodb/mongodb-original.svg";
import mongoose from "devicon/icons/mongoose/mongoose-original.svg";
import mysql from "devicon/icons/mysql/mysql-original.svg";
import nestjs from "devicon/icons/nestjs/nestjs-original.svg";
import nextjs from "devicon/icons/nextjs/nextjs-original.svg";
import nodejs from "devicon/icons/nodejs/nodejs-original.svg";
import nuxtjs from "devicon/icons/nuxtjs/nuxtjs-original.svg";
import playwright from "devicon/icons/playwright/playwright-original.svg";
import postcss from "devicon/icons/postcss/postcss-original.svg";
import postgresql from "devicon/icons/postgresql/postgresql-original.svg";
import prisma from "devicon/icons/prisma/prisma-original.svg";
import qwik from "devicon/icons/qwik/qwik-original.svg";
import react from "devicon/icons/react/react-original.svg";
import redis from "devicon/icons/redis/redis-original.svg";
import redux from "devicon/icons/redux/redux-original.svg";
import remix from "devicon/icons/remix/remix-original.svg";
import sass from "devicon/icons/sass/sass-original.svg";
import sequelize from "devicon/icons/sequelize/sequelize-original.svg";
import socketio from "devicon/icons/socketio/socketio-original.svg";
import solidjs from "devicon/icons/solidjs/solidjs-original.svg";
import sqlite from "devicon/icons/sqlite/sqlite-original.svg";
import storybook from "devicon/icons/storybook/storybook-original.svg";
import supabase from "devicon/icons/supabase/supabase-original.svg";
import svelte from "devicon/icons/svelte/svelte-original.svg";
import tailwindcss from "devicon/icons/tailwindcss/tailwindcss-original.svg";
import tauri from "devicon/icons/tauri/tauri-original.svg";
import trpc from "devicon/icons/trpc/trpc-original.svg";
import typescript from "devicon/icons/typescript/typescript-original.svg";
import vitejs from "devicon/icons/vitejs/vitejs-original.svg";
import vitest from "devicon/icons/vitest/vitest-original.svg";
import vuejs from "devicon/icons/vuejs/vuejs-original.svg";
import webpack from "devicon/icons/webpack/webpack-original.svg";
import zustand from "devicon/icons/zustand/zustand-original.svg";
import cypress from "simple-icons/icons/cypress.svg";
import drizzle from "simple-icons/icons/drizzle.svg";
import esbuild from "simple-icons/icons/esbuild.svg";
import hono from "simple-icons/icons/hono.svg";
import koa from "simple-icons/icons/koa.svg";
import lerna from "simple-icons/icons/lerna.svg";
import less from "simple-icons/icons/less.svg";
import nx from "simple-icons/icons/nx.svg";
import preact from "simple-icons/icons/preact.svg";
import prettier from "simple-icons/icons/prettier.svg";
import radixui from "simple-icons/icons/radixui.svg";
import reactquery from "simple-icons/icons/reactquery.svg";
import reactrouter from "simple-icons/icons/reactrouter.svg";
import recoil from "simple-icons/icons/recoil.svg";
import styledcomponents from "simple-icons/icons/styledcomponents.svg";
import swc from "simple-icons/icons/swc.svg";
import tanstack from "simple-icons/icons/tanstack.svg";
import turborepo from "simple-icons/icons/turborepo.svg";
import typeorm from "simple-icons/icons/typeorm.svg";
import zod from "simple-icons/icons/zod.svg";

/**
 * Icon mapping for the scanner's technology IDs.
 *
 * Devicon (full-color brand marks) is the primary source; Simple Icons is the
 * fallback for technologies Devicon does not ship. Both packages bundle the SVGs
 * locally, so every icon resolves offline through Vite's asset pipeline.
 *
 * `adjust` holds Tailwind filters used to keep near-black brand marks legible on
 * Orbit's dark surfaces (e.g. the black Next.js / Express / Socket.IO wordmarks).
 */
export type TechIconDescriptor = { kind: "image"; url: string; adjust?: string } | { kind: "mask"; url: string; color: string };

const image = (url: string, adjust?: string): TechIconDescriptor => ({ kind: "image", url, adjust });
const mask = (url: string, color: string): TechIconDescriptor => ({ kind: "mask", url, color });

const TECH_ICONS: Record<string, TechIconDescriptor> = {
    // Languages
    javascript: image(javascript),
    typescript: image(typescript),

    // Frontend
    react: image(react),
    next: image(nextjs, "invert"),
    "react-native": image(react),
    expo: image(expo, "invert"),
    vue: image(vuejs),
    nuxt: image(nuxtjs),
    svelte: image(svelte),
    sveltekit: image(svelte),
    angular: image(angular),
    astro: image(astro, "invert"),
    solid: image(solidjs),
    preact: mask(preact, "#673AB8"),
    qwik: image(qwik),
    ember: image(ember),
    remix: image(remix, "invert"),
    gatsby: image(gatsby),
    alpinejs: image(alpinejs, "brightness-150"),
    htmx: image(htmx, "brightness-150"),

    // Backend
    node: image(nodejs),
    express: image(express, "invert"),
    nestjs: image(nestjs),
    fastify: image(fastify),
    hono: mask(hono, "#E36002"),
    koa: mask(koa, "#8B8B93"),
    adonisjs: image(adonisjs),
    graphql: image(graphql),
    apollo: image(apollographql, "brightness-200"),
    trpc: image(trpc),

    // Styling
    tailwindcss: image(tailwindcss),
    sass: image(sass),
    less: mask(less, "#5C87C7"),
    postcss: image(postcss),
    bootstrap: image(bootstrap),
    bulma: image(bulma),
    chakra: image(chakraui),
    materialui: image(materialui),
    radix: mask(radixui, "#C4B5FD"),
    "styled-components": mask(styledcomponents, "#DB7093"),

    // Database / ORM
    prisma: image(prisma, "invert"),
    mongoose: image(mongoose, "brightness-150"),
    drizzle: mask(drizzle, "#C5F74F"),
    postgres: image(postgresql),
    mysql: image(mysql),
    sqlite: image(sqlite),
    mongodb: image(mongodb),
    redis: image(redis),
    sequelize: image(sequelize),
    typeorm: mask(typeorm, "#FE0803"),
    knex: image(knexjs),
    supabase: image(supabase),
    firebase: image(firebase),

    // Tools
    vite: image(vitejs),
    "tanstack-query": mask(reactquery, "#FF4154"),
    "tanstack-router": mask(tanstack, "#ECE8D1"),
    socketio: image(socketio, "invert"),
    electron: image(electron),
    "electron-vite": image(electron),
    turborepo: mask(turborepo, "#FF1E56"),
    bun: image(bun),
    jest: image(jest),
    vitest: image(vitest),
    webpack: image(webpack),
    esbuild: mask(esbuild, "#FFCF00"),
    storybook: image(storybook),
    playwright: image(playwright),
    cypress: mask(cypress, "#69D3A7"),
    eslint: image(eslint),
    prettier: mask(prettier, "#F7B93E"),
    biome: image(biome),
    zod: mask(zod, "#408AFF"),
    zustand: image(zustand, "invert"),
    redux: image(redux),
    mobx: image(mobx),
    recoil: mask(recoil, "#3578E5"),
    axios: image(axios),
    reactrouter: mask(reactrouter, "#CA4245"),
    tauri: image(tauri),
    capacitor: image(capacitor),
    ionic: image(ionic),
    babel: image(babel),
    swc: mask(swc, "#F8C457"),
    nx: mask(nx, "#7CB7F0"),
    lerna: mask(lerna, "#C084FC"),
};

export function getTechIcon(name: string): TechIconDescriptor | undefined {
    const key = name.trim().toLowerCase();
    return key.length > 0 ? TECH_ICONS[key] : undefined;
}
