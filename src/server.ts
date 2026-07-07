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
    const layoutDir = path.join(__dirname, '..', 'public', 'layout', layoutName);
    if (!fs.existsSync(layoutDir)) {
      fs.mkdirSync(layoutDir, { recursive: true });
    }
    const filePath = path.join(layoutDir, 'layout.json');
    fs.writeFileSync(filePath, JSON.stringify(req.body.data, null, 2));
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
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      res.json(data);
      return;
    }

    const savPath = path.join(layoutDir, 'layout.sav');
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
    const layoutDir = path.join(__dirname, '..', 'public', 'layout', layoutName || 'custom');
    
    if (!fs.existsSync(layoutDir)) {
      fs.mkdirSync(layoutDir, { recursive: true });
    }

    const base64Data = data.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(layoutDir, fileName);
    fs.writeFileSync(filePath, buffer);

    res.json({ ok: true, fileName });
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
