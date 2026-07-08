import { app, BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { createLocalServer } from './local-server';
import { PORT } from './types';

let mainWindow: BrowserWindow | null = null;
let server: http.Server | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 750,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    },
    autoHideMenuBar: true
  });

  mainWindow.loadURL(`http://localhost:${PORT}`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

function startServer(): void {
  const userDataDir = app.getPath('userData');

  server = createLocalServer({
    port: PORT,
    publicDir: path.join(__dirname, '..', 'public'),
    builtinLayoutDir: path.join(__dirname, '..', 'public', 'layout'),
    userLayoutDir: path.join(userDataDir, 'user-layouts'),
    defaultLayoutFile: path.join(userDataDir, 'default-layout.json'),
    pidFile: path.join(userDataDir, 'server.pid'),
    onListening: createWindow
  });
}

app.whenReady().then(() => {
  startServer();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (server) server.close();

  const pidFile = path.join(app.getPath('userData'), 'server.pid');
  if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile);

  if (process.platform !== 'darwin') app.quit();
});
