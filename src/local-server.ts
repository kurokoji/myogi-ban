import express from 'express';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import WebSocket from 'ws';
import type { GamepadState, Layout, LayoutEntry } from './types';

export interface LocalServerOptions {
  port: number;
  publicDir: string;
  builtinLayoutDir: string;
  userLayoutDir: string;
  defaultLayoutFile: string;
  pidFile?: string;
  onListening?: (server: http.Server) => void;
}

function getLayoutDirs(baseDir: string): string[] {
  if (!fs.existsSync(baseDir)) return [];
  return fs.readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function findLayoutPath(name: string, options: LocalServerOptions): string | null {
  const userPath = path.join(options.userLayoutDir, name);
  if (fs.existsSync(userPath)) return userPath;

  const builtinPath = path.join(options.builtinLayoutDir, name);
  if (fs.existsSync(builtinPath)) return builtinPath;

  return null;
}

function collectLayoutAssets(layout: unknown): string[] {
  const data = layout as Partial<Layout> | null;
  const assets = new Set<string>();
  const add = (fileName: unknown) => {
    if (typeof fileName === 'string' && fileName.trim()) {
      assets.add(path.basename(fileName));
    }
  };

  add(data?.background?.image);
  add(data?.defaultbuttons?.img);
  add(data?.defaultbuttons?.imgp);
  for (const button of data?.buttons || []) {
    add(button?.img);
    add(button?.imgp);
  }

  return [...assets];
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function writeText(filePath: string, data: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, data);
}

function copyLayoutAssets(
  layout: unknown,
  sourceLayoutName: string,
  targetLayoutName: string,
  options: LocalServerOptions
): void {
  const targetDir = path.join(options.userLayoutDir, targetLayoutName);
  const sourceLayoutPath = findLayoutPath(sourceLayoutName, options);
  const sourceDirs: string[] = [];

  if (sourceLayoutPath) sourceDirs.push(sourceLayoutPath);
  sourceDirs.push(...getLayoutDirs(options.userLayoutDir).map((name) => path.join(options.userLayoutDir, name)));
  sourceDirs.push(...getLayoutDirs(options.builtinLayoutDir).map((name) => path.join(options.builtinLayoutDir, name)));

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

function readLayout(name: string, options: LocalServerOptions): unknown {
  const layoutPath = findLayoutPath(name, options);
  if (!layoutPath) return {};

  const jsonPath = path.join(layoutPath, 'layout.json');
  if (!fs.existsSync(jsonPath)) return {};

  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function listLayouts(options: LocalServerOptions): LayoutEntry[] {
  return [
    ...getLayoutDirs(options.builtinLayoutDir).map((name) => ({ name, builtin: true })),
    ...getLayoutDirs(options.userLayoutDir).map((name) => ({ name, builtin: false }))
  ];
}

export function createLocalServer(options: LocalServerOptions): http.Server {
  const expressApp = express();
  const server = http.createServer(expressApp);
  const wss = new WebSocket.Server({ server });
  let latestState: GamepadState | null = null;

  const broadcastState = (state: GamepadState): void => {
    const message = JSON.stringify({ type: 'state', data: state });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  expressApp.use('/layout', express.static(options.userLayoutDir));
  expressApp.use(express.static(options.publicDir));
  expressApp.use(express.json({ limit: '100mb' }));

  expressApp.get('/view', (_req, res) => {
    res.sendFile(path.join(options.publicDir, 'view.html'));
  });

  expressApp.post('/api/state', (req, res) => {
    latestState = req.body as GamepadState;
    broadcastState(latestState);
    res.json({ ok: true });
  });

  expressApp.get('/api/state', (_req, res) => {
    res.json(latestState || {});
  });

  expressApp.post('/api/layout/save', (req, res) => {
    const layoutName = req.body.name || 'custom';
    const layoutDir = path.join(options.userLayoutDir, layoutName);
    ensureDir(layoutDir);

    const data = { ...req.body.data, name: layoutName };
    copyLayoutAssets(req.body.data, req.body.data?.name || layoutName, layoutName, options);
    writeJson(path.join(layoutDir, 'layout.json'), data);
    res.json({ ok: true });
  });

  expressApp.get('/api/layouts', (_req, res) => {
    res.json(listLayouts(options));
  });

  expressApp.get('/api/layout/:name', (req, res) => {
    res.json(readLayout(req.params.name, options));
  });

  expressApp.post('/api/upload-image', (req, res) => {
    const { data, layoutName, fileName } = req.body;
    const safeFileName = path.basename(fileName);
    const layoutDir = path.join(options.userLayoutDir, layoutName || 'custom');
    ensureDir(layoutDir);

    const base64Data = data.replace(/^data:image\/[^;]+;base64,/, '');
    fs.writeFileSync(path.join(layoutDir, safeFileName), Buffer.from(base64Data, 'base64'));
    res.json({ ok: true, fileName: safeFileName });
  });

  expressApp.get('/api/default-layout', (_req, res) => {
    if (fs.existsSync(options.defaultLayoutFile)) {
      res.json(JSON.parse(fs.readFileSync(options.defaultLayoutFile, 'utf8')));
    } else {
      res.json({ name: 'default' });
    }
  });

  expressApp.post('/api/default-layout', (req, res) => {
    writeJson(options.defaultLayoutFile, { name: req.body.name });
    res.json({ ok: true });
  });

  wss.on('connection', (ws) => {
    if (latestState) {
      ws.send(JSON.stringify({ type: 'state', data: latestState }));
    }
  });

  server.listen(options.port, () => {
    if (options.pidFile) {
      writeText(options.pidFile, process.pid.toString());
    }
    options.onListening?.(server);
  });

  return server;
}
