import express from "express";
import * as fs from "fs";
import * as http from "http";
import * as path from "path";
import WebSocket from "ws";
import { LayoutRepository } from "./layout-repository";
import { registerImageRoutes } from "./server-routes/image-routes";
import { registerLayoutRoutes } from "./server-routes/layout-routes";
import { registerStateRoutes } from "./server-routes/state-routes";
import type { GamepadState } from "./types";

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
  const stateStore: { latest: GamepadState | null } = { latest: null };

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

  registerStateRoutes(expressApp, stateStore, broadcastState);
  registerLayoutRoutes(expressApp, layouts);
  registerImageRoutes(expressApp, layouts);

  wss.on("connection", (ws) => {
    if (stateStore.latest) {
      ws.send(JSON.stringify({ type: "state", data: stateStore.latest }));
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
