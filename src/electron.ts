import { spawn } from "child_process";
import { app, BrowserWindow, shell } from "electron";
import type * as http from "http";
import * as path from "path";
import { resolveElectronDataDir } from "./data-paths";
import { resolveElectronLaunchOptions } from "./electron-launch-options";
import { resolveElectronRendererUrl } from "./electron-renderer";
import { shouldOpenWindowForSecondInstance } from "./electron-single-instance";
import { requestRunningWindow } from "./electron-window-request";
import { createLocalServer } from "./local-server";
import { getInstalledObsPluginVersion } from "./obs-plugin-install-status";
import { cleanupLocalServer } from "./server-cleanup";
import { PORT } from "./types";
import { UpdateManager } from "./update-manager";
import { WhatsNewManager } from "./whats-new-manager";

let mainWindow: BrowserWindow | null = null;
let server: http.Server | null = null;
let dataDir = "";
const launchOptions = resolveElectronLaunchOptions(process.argv);
const hasSingleInstanceLock = app.requestSingleInstanceLock();
let windowRequested = !launchOptions.serverOnly;

function createWindow(): void {
  const window = new BrowserWindow({
    width: 1600,
    height: 1000,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    autoHideMenuBar: true,
  });
  mainWindow = window;

  window.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  window.loadURL(
    resolveElectronRendererUrl({
      development: launchOptions.development,
      serverPort: PORT,
    }),
  );
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

function launchInstaller(installerPath: string): void {
  spawn(installerPath, [], { detached: true, stdio: "ignore" }).unref();
  app.quit();
}

function launchObsPluginInstaller(installerPath: string): void {
  // The OBS plugin installer requires admin (RequestExecutionLevel admin in
  // obs-plugin/installer.nsi), which needs ShellExecute to trigger the UAC
  // prompt; launching it via CreateProcess directly gets rejected with
  // ERROR_ELEVATION_REQUIRED (surfaced by Node as EACCES).
  void shell.openPath(installerPath);
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
    updateManager: new UpdateManager({
      currentVersion: app.getVersion(),
      install: {
        downloadDirectory: app.getPath("temp"),
        launchInstaller,
        launchObsPluginInstaller,
        getInstalledObsPluginVersion,
      },
    }),
    whatsNewManager: new WhatsNewManager({
      currentVersion: app.getVersion(),
      stateFile: path.join(dataDir, "last-seen-version.json"),
    }),
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
