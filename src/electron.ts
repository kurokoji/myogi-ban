import { app, BrowserWindow, dialog } from "electron";
import type * as http from "http";
import * as path from "path";
import { resolveElectronDataDir } from "./data-paths";
import { resolveElectronLaunchOptions } from "./electron-launch-options";
import { resolveElectronRendererUrl } from "./electron-renderer";
import { shouldOpenWindowForSecondInstance } from "./electron-single-instance";
import {
  confirmElectronUnload,
  electronUnsavedChangesDialog,
} from "./electron-unsaved-changes";
import { requestRunningWindow } from "./electron-window-request";
import { createLocalServer } from "./local-server";
import { cleanupLocalServer } from "./server-cleanup";
import { PORT } from "./types";

let mainWindow: BrowserWindow | null = null;
let server: http.Server | null = null;
let dataDir = "";
const launchOptions = resolveElectronLaunchOptions(process.argv);
const hasSingleInstanceLock = app.requestSingleInstanceLock();
let windowRequested = !launchOptions.serverOnly;

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1200,
    height: 850,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });
  mainWindow = window;

  window.loadURL(
    resolveElectronRendererUrl({
      development: launchOptions.development,
      serverPort: PORT,
    }),
  );
  window.webContents.on("will-prevent-unload", (event) => {
    confirmElectronUnload(
      event,
      () =>
        dialog.showMessageBoxSync(
          window,
          electronUnsavedChangesDialog(app.getLocale()),
        ) === 0,
    );
  });
  window.on("closed", () => {
    mainWindow = null;
  });
}

function showMainWindow(): void {
  windowRequested = true;
  if (!mainWindow) {
    if (server?.listening) createWindow();
    return;
  }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function startServer(): void {
  dataDir = resolveElectronDataDir(
    launchOptions.development,
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
    onListening: () => {
      if (windowRequested) showMainWindow();
    },
    onShowWindow: showMainWindow,
  });
}

if (!hasSingleInstanceLock) {
  if (launchOptions.serverOnly) {
    app.quit();
  } else {
    void requestRunningWindow(PORT).finally(() => app.quit());
  }
}

if (hasSingleInstanceLock) {
  app.on("second-instance", (_event, commandLine) => {
    if (shouldOpenWindowForSecondInstance(commandLine)) showMainWindow();
  });

  app.whenReady().then(() => {
    startServer();

    app.on("activate", () => {
      if (windowRequested && BrowserWindow.getAllWindows().length === 0) {
        showMainWindow();
      }
    });
  });
}

app.on("window-all-closed", () => {
  if (launchOptions.serverOnly) return;
  cleanupLocalServer(server, path.join(dataDir, "server.pid"));
  server = null;

  if (process.platform !== "darwin") app.quit();
});
