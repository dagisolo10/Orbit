import { electronApp, optimizer } from "@electron-toolkit/utils";
import { registerIpcHandlers } from "@main/ipc/registration";
import { scanDir } from "@main/scanner/scan";
import { app, BrowserWindow, dialog } from "electron";
import path from "path";

import { createWindow } from "./window/main";

let mainWindow: BrowserWindow | null = null;

export function getMainWindow() {
    return mainWindow;
}

process.on("unhandledRejection", (reason) => dialog.showErrorBox("Unhandled Rejection", String(reason)));
process.on("uncaughtException", (error) => dialog.showErrorBox("Main Process Error", error.stack || error.message));

app.whenReady().then(async () => {
    electronApp.setAppUserModelId("com.orbit.app");

    app.on("browser-window-created", (_, window) => optimizer.watchWindowShortcuts(window));
    registerIpcHandlers();

    const rootPath = path.join(app.getPath("home"), "Projects");
    await scanDir(rootPath);

    createAndCloseWindow();

    app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createAndCloseWindow());
});

app.on("window-all-closed", () => process.platform !== "darwin" && closeWindow());

function createAndCloseWindow() {
    mainWindow = createWindow();

    if (mainWindow) {
        mainWindow.on("closed", closeWindow);
    }
}

function closeWindow() {
    app.quit();
    mainWindow = null;
}
