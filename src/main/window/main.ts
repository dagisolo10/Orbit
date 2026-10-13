import { is } from "@electron-toolkit/utils";
import { BrowserWindow, shell } from "electron";
import { join } from "path";

export function createWindow() {
    const mainWindow = new BrowserWindow({
        show: false,
        autoHideMenuBar: true,
        webPreferences: { preload: join(__dirname, "../preload/index.js"), sandbox: false },
    });

    mainWindow.on("ready-to-show", () => {
        mainWindow.show();
        mainWindow.maximize();
    });

    mainWindow.webContents.setWindowOpenHandler((details) => {
        void shell.openExternal(details.url);
        return { action: "deny" };
    });

    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        void mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
        void mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
    }

    return mainWindow;
}
