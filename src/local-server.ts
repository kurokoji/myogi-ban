import express from "express";
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import WebSocket from "ws";
import { LayoutRepository } from "./layout-repository";
import type { GamepadState, Layout } from "./types";

export interface LocalServerOptions {
  port: number;
  publicDir: string;
  builtinLayoutDir: string;
  userLayoutDir: string;
  defaultLayoutFile: string;
  pidFile?: string;
  onListening?: (server: http.Server) => void;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function writeText(filePath: string, data: string): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, data);
}

export function createLocalServer(options: LocalServerOptions): http.Server {
  const expressApp = express();
  const server = http.createServer(expressApp);
  const wss = new WebSocket.Server({ server });
  const layouts = new LayoutRepository(options);
  let latestState: GamepadState | null = null;

  const broadcastState = (state: GamepadState): void => {
    const message = JSON.stringify({ type: "state", data: state });
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  expressApp.use("/layout", express.static(options.userLayoutDir));
  expressApp.use(express.static(options.publicDir));
  expressApp.use(express.json({ limit: "100mb" }));

  expressApp.get("/view", (_req, res) => {
    res.sendFile(path.join(options.publicDir, "view.html"));
  });

  expressApp.post("/api/state", (req, res) => {
    latestState = req.body as GamepadState;
    broadcastState(latestState);
    res.json({ ok: true });
  });

  expressApp.get("/api/state", (_req, res) => {
    res.json(latestState || {});
  });

  expressApp.post("/api/layout/save", (req, res) => {
    const layoutName = req.body.name || "custom";
    layouts.save(layoutName, req.body.data as Layout);
    res.json({ ok: true });
  });

  expressApp.get("/api/layouts", (_req, res) => {
    res.json(layouts.list());
  });

  expressApp.get("/api/layout/:name", (req, res) => {
    res.json(layouts.read(req.params.name, req.query.builtin === "true"));
  });

  expressApp.delete("/api/layout/:name", (req, res) => {
    if (!layouts.delete(req.params.name)) {
      res.status(404).json({ ok: false });
      return;
    }
    res.json({ ok: true });
  });

  expressApp.post("/api/upload-image", (req, res) => {
    const { data, layoutName, fileName } = req.body;
    const safeFileName = layouts.uploadImage(
      data,
      layoutName || "custom",
      fileName,
    );
    res.json({ ok: true, fileName: safeFileName });
  });

  expressApp.get("/api/default-layout", (_req, res) => {
    res.json(layouts.getDefault());
  });

  expressApp.post("/api/default-layout", (req, res) => {
    layouts.setDefault(req.body.name);
    res.json({ ok: true });
  });

  wss.on("connection", (ws) => {
    if (latestState) {
      ws.send(JSON.stringify({ type: "state", data: latestState }));
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
