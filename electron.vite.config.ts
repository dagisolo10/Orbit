import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import { resolve } from "path";

export default defineConfig({
    main: {
        resolve: {
            alias: {
                "@main": resolve(__dirname, "src/main"),
                "@server": resolve(__dirname, "src/main/server"),
                "@shared": resolve(__dirname, "src/shared"),
            },
        },
    },
    preload: {
        resolve: {
            alias: {
                "@preload": resolve(__dirname, "src/preload"),
                "@shared": resolve(__dirname, "src/shared"),
            },
        },
    },
    renderer: {
        resolve: {
            alias: {
                "@": resolve("src/renderer/src"),
                "@renderer": resolve("src/renderer/src"),
                "@shared": resolve("src/shared"),
            },
        },
        plugins: [react()],
    },
});
