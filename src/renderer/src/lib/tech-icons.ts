import bun from "devicon/icons/bun/bun-original.svg";
import electron from "devicon/icons/electron/electron-original.svg";
import expo from "devicon/icons/expo/expo-original.svg";
import express from "devicon/icons/express/express-original.svg";
import javascript from "devicon/icons/javascript/javascript-original.svg";
import jest from "devicon/icons/jest/jest-plain.svg";
import mongoose from "devicon/icons/mongoose/mongoose-original.svg";
import nestjs from "devicon/icons/nestjs/nestjs-original.svg";
import nextjs from "devicon/icons/nextjs/nextjs-original.svg";
import nodejs from "devicon/icons/nodejs/nodejs-original.svg";
import prisma from "devicon/icons/prisma/prisma-original.svg";
import react from "devicon/icons/react/react-original.svg";
import socketio from "devicon/icons/socketio/socketio-original.svg";
import tailwindcss from "devicon/icons/tailwindcss/tailwindcss-original.svg";
import typescript from "devicon/icons/typescript/typescript-original.svg";
import vitejs from "devicon/icons/vitejs/vitejs-original.svg";
import vitest from "devicon/icons/vitest/vitest-original.svg";
import webpack from "devicon/icons/webpack/webpack-original.svg";

import drizzle from "simple-icons/icons/drizzle.svg";
import esbuild from "simple-icons/icons/esbuild.svg";
import reactquery from "simple-icons/icons/reactquery.svg";
import tanstack from "simple-icons/icons/tanstack.svg";
import turborepo from "simple-icons/icons/turborepo.svg";

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

    // Backend
    node: image(nodejs),
    express: image(express, "invert"),
    nestjs: image(nestjs),

    // Styling
    tailwindcss: image(tailwindcss),

    // Database / ORM
    prisma: image(prisma, "invert"),
    mongoose: image(mongoose, "brightness-150"),
    drizzle: mask(drizzle, "#C5F74F"),

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
};

export function getTechIcon(name: string): TechIconDescriptor | undefined {
    const key = name.trim().toLowerCase();
    return key.length > 0 ? TECH_ICONS[key] : undefined;
}
