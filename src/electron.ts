import { app, BrowserWindow } from "electron";
import type * as http from "http";
import * as path from "path";
import { resolveElectronDataDir } from "./data-paths";
import { resolveElectronRendererUrl } from "./electron-renderer";
import { createLocalServer } from "./local-server";
import { cleanupLocalServer } from "./server-cleanup";
import { PORT } from "./types";

let mainWindow: BrowserWindow | null = null;
let server: http.Server | null = null;
let dataDir = "";
const development = process.argv.includes("--dev");

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 850,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });

  mainWindow.loadURL(
    resolveElectronRendererUrl({ development, serverPort: PORT }),
  );
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function startServer(): void {
  dataDir = resolveElectronDataDir(
    development,
    path.join(__dirname, ".."),
    app.getPath("userData"),
  );

  server = createLocalServer({
    port: PORT,
    publicDir: path.join(__dirname, "..", "public"),
    builtinLayoutDir: path.join(__dirname, "..", "public", "layout"),
    userLayoutDir: path.join(dataDir, "user-layouts"),
    defaultLayoutFile: path.join(dataDir, "default-layout.json"),
    pidFile: path.join(dataDir, "server.pid"),
    onListening: createWindow,
  });
}

app.whenReady().then(() => {
  startServer();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  cleanupLocalServer(server, path.join(dataDir, "server.pid"));
  server = null;

  if (process.platform !== "darwin") app.quit();
});
