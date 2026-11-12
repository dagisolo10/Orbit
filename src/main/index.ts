import { electronApp, optimizer } from "@electron-toolkit/utils";
import { registerIpcHandlers } from "@main/ipc/registration";
import { serverService } from "@main/server/service";
import { app, BrowserWindow, dialog } from "electron";

import { createWindow } from "./window/main";

let mainWindow: BrowserWindow | null = null;

export function getMainWindow() {
    return mainWindow;
}

process.on("unhandledRejection", (reason) => dialog.showErrorBox("Unhandled Rejection", String(reason)));
process.on("uncaughtException", (error) => dialog.showErrorBox("Main Process Error", error.stack || error.message));

void app.whenReady().then(async () => {
    electronApp.setAppUserModelId("com.orbit.app");

    app.on("browser-window-created", (_, window) => optimizer.watchWindowShortcuts(window));
    registerIpcHandlers();

    createAndCloseWindow();

    app.on("activate", () => BrowserWindow.getAllWindows().length === 0 && createAndCloseWindow());
});

app.on("window-all-closed", () => process.platform !== "darwin" && closeWindow());

// Development servers are spawned in their own process groups, so they are not
// reaped automatically when Electron exits. Stop them explicitly on quit.
app.on("before-quit", () => serverService.dispose());

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
