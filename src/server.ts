import express from 'express';
import * as path from 'path';
import * as http from 'http';
import WebSocket from 'ws';
import * as fs from 'fs';

let server: http.Server;
let wss: WebSocket.Server;
const PORT = 33770;
let latestState: any = null;
const PID_FILE = path.join(__dirname, '..', 'server.pid');
const LAYOUT_BASE = path.join(__dirname, '..', 'public', 'layout');
const USER_LAYOUT_BASE = path.join(__dirname, '..', 'public', 'user-layouts');
const DEFAULT_LAYOUT_FILE = path.join(__dirname, '..', 'default-layout.json');

function getUserLayoutDirs(): string[] {
  if (!fs.existsSync(USER_LAYOUT_BASE)) return [];
  return fs.readdirSync(USER_LAYOUT_BASE, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function getBuiltinLayoutDirs(): string[] {
  if (!fs.existsSync(LAYOUT_BASE)) return [];
  return fs.readdirSync(LAYOUT_BASE, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);
}

function findLayoutPath(name: string): string | null {
  const userPath = path.join(USER_LAYOUT_BASE, name);
  if (fs.existsSync(userPath)) return userPath;
  const builtinPath = path.join(LAYOUT_BASE, name);
  if (fs.existsSync(builtinPath)) return builtinPath;
  return null;
}

function collectLayoutAssets(layout: any): string[] {
  const assets = new Set<string>();
  const add = (fileName: unknown) => {
    if (typeof fileName === 'string' && fileName.trim()) {
      assets.add(path.basename(fileName));
    }
  };

  add(layout?.background?.image);
  add(layout?.defaultbuttons?.img);
  add(layout?.defaultbuttons?.imgp);
  for (const button of layout?.buttons || []) {
    add(button?.img);
    add(button?.imgp);
  }
  return [...assets];
}

function copyLayoutAssets(layout: any, sourceLayoutName: string, targetLayoutName: string): void {
  const targetDir = path.join(USER_LAYOUT_BASE, targetLayoutName);
  const userDirs = getUserLayoutDirs();
  const builtinDirs = getBuiltinLayoutDirs();
  const sourceLayoutPath = findLayoutPath(sourceLayoutName);
  const sourceDirs: string[] = [];
  if (sourceLayoutPath) sourceDirs.push(sourceLayoutPath);
  sourceDirs.push(...userDirs.map(d => path.join(USER_LAYOUT_BASE, d)));
  sourceDirs.push(...builtinDirs.map(d => path.join(LAYOUT_BASE, d)));

  for (const asset of collectLayoutAssets(layout)) {
    const targetPath = path.join(targetDir, asset);
    if (fs.existsSync(targetPath)) continue;

    for (const sourceDir of sourceDirs) {
      const sourcePath = path.join(sourceDir, asset);
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
        break;
      }
    }
  }
}

function createServer(): void {
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
    const layoutDir = path.join(USER_LAYOUT_BASE, layoutName);
    if (!fs.existsSync(layoutDir)) {
      fs.mkdirSync(layoutDir, { recursive: true });
    }
    const data = { ...req.body.data, name: layoutName };
    copyLayoutAssets(req.body.data, req.body.data?.name || layoutName, layoutName);
    const filePath = path.join(layoutDir, 'layout.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    res.json({ ok: true });
  });

  expressApp.get('/api/layouts', (req, res) => {
    const builtin = getBuiltinLayoutDirs();
    const user = getUserLayoutDirs();
    const all = [...new Set([...builtin, ...user])];
    res.json(all);
  });

  expressApp.get('/api/layout/:name', (req, res) => {
    const layoutPath = findLayoutPath(req.params.name);
    if (!layoutPath) {
      res.json({});
      return;
    }

    const jsonPath = path.join(layoutPath, 'layout.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      res.json(data);
      return;
    }

    const savPath = path.join(layoutPath, 'layout.sav');
    if (fs.existsSync(savPath)) {
      const content = fs.readFileSync(savPath, 'utf8');
      const match = content.match(/onLoadLayout\(([\s\S]+)\);?/);
      if (match) {
        try {
          const data = JSON.parse(match[1]);
          res.json(data);
          return;
        } catch {
          // parse failed
        }
      }
    }

    res.json({});
  });

  expressApp.post('/api/upload-image', (req, res) => {
    const { data, layoutName, fileName } = req.body;
    const safeFileName = path.basename(fileName);
    const layoutDir = path.join(USER_LAYOUT_BASE, layoutName || 'custom');
    
    if (!fs.existsSync(layoutDir)) {
      fs.mkdirSync(layoutDir, { recursive: true });
    }

    const base64Data = data.replace(/^data:image\/[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(layoutDir, safeFileName);
    fs.writeFileSync(filePath, buffer);

    res.json({ ok: true, fileName: safeFileName });
  });

  expressApp.get('/api/default-layout', (req, res) => {
    if (fs.existsSync(DEFAULT_LAYOUT_FILE)) {
      const data = JSON.parse(fs.readFileSync(DEFAULT_LAYOUT_FILE, 'utf8'));
      res.json(data);
    } else {
      res.json({ name: 'preset' });
    }
  });

  expressApp.post('/api/default-layout', (req, res) => {
    const { name } = req.body;
    fs.writeFileSync(DEFAULT_LAYOUT_FILE, JSON.stringify({ name }, null, 2));
    res.json({ ok: true });
  });

  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    if (latestState) {
      ws.send(JSON.stringify({ type: 'state', data: latestState }));
    }
  });

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`OBS browser source URL: http://localhost:${PORT}/view`);
    
    // PIDファイルを作成
    fs.writeFileSync(PID_FILE, process.pid.toString());
    console.log(`PID: ${process.pid} (saved to ${PID_FILE})`);
  });

  // シグナル処理
  const cleanup = () => {
    console.log('\nShutting down...');
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGTERM', cleanup);
  process.on('SIGINT', cleanup);
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

createServer();
