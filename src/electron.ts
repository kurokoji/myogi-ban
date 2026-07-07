import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import express from 'express';
import * as http from 'http';
import WebSocket from 'ws';
import * as fs from 'fs';

const PORT = 33770;
const PID_FILE = path.join(__dirname, '..', 'server.pid');
let mainWindow: BrowserWindow | null = null;
let server: http.Server;
let wss: WebSocket.Server;
let latestState: any = null;

function startServer(): void {
  const expressApp = express();
  server = http.createServer(expressApp);

  expressApp.use(express.static(path.join(__dirname, '..', 'public')));
  expressApp.use(express.json({ limit: '100mb' }));

  expressApp.get('/view', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'view.html'));
  });

  expressApp.post('/api/state', (req, res) => {
    latestState = req.body;
    broadcastState(latestState);
    res.json({ ok: true });
  });

  expressApp.get('/api/state', (req, res) => {
    res.json(latestState || {});
  });

  expressApp.post('/api/layout/save', (req, res) => {
    const layoutName = req.body.name || 'custom';
    const layoutDir = path.join(__dirname, '..', 'public', 'layout', layoutName);
    if (!fs.existsSync(layoutDir)) {
      fs.mkdirSync(layoutDir, { recursive: true });
    }
    fs.writeFileSync(path.join(layoutDir, 'layout.json'), JSON.stringify(req.body.data, null, 2));
    res.json({ ok: true });
  });

  expressApp.get('/api/layouts', (req, res) => {
    const layoutBase = path.join(__dirname, '..', 'public', 'layout');
    const dirs = fs.readdirSync(layoutBase, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);
    res.json(dirs);
  });

  expressApp.get('/api/layout/:name', (req, res) => {
    const layoutDir = path.join(__dirname, '..', 'public', 'layout', req.params.name);

    const jsonPath = path.join(layoutDir, 'layout.json');
    if (fs.existsSync(jsonPath)) {
      res.json(JSON.parse(fs.readFileSync(jsonPath, 'utf8')));
      return;
    }

    const savPath = path.join(layoutDir, 'layout.sav');
    if (fs.existsSync(savPath)) {
      const content = fs.readFileSync(savPath, 'utf8');
      const match = content.match(/onLoadLayout\(([\s\S]+)\);?/);
      if (match) {
        try {
          res.json(JSON.parse(match[1]));
          return;
        } catch { /* parse failed */ }
      }
    }

    res.json({});
  });

  expressApp.post('/api/upload-image', (req, res) => {
    const { data, layoutName, fileName } = req.body;
    const layoutDir = path.join(__dirname, '..', 'public', 'layout', layoutName || 'custom');
    if (!fs.existsSync(layoutDir)) {
      fs.mkdirSync(layoutDir, { recursive: true });
    }
    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(path.join(layoutDir, fileName), Buffer.from(base64Data, 'base64'));
    res.json({ ok: true, fileName });
  });

  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    if (latestState) {
      ws.send(JSON.stringify({ type: 'state', data: latestState }));
    }
  });

  server.listen(PORT);
}

function broadcastState(state: any): void {
  if (!wss) return;
  const msg = JSON.stringify({ type: 'state', data: state });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

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

app.whenReady().then(() => {
  startServer();
  fs.writeFileSync(PID_FILE, process.pid.toString());
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (server) server.close();
  if (fs.existsSync(PID_FILE)) fs.unlinkSync(PID_FILE);
  if (process.platform !== 'darwin') app.quit();
});