import * as path from "path";
import { createLocalServer } from "./local-server";
import { PORT } from "./types";
import { UpdateManager } from "./update-manager";

const ROOT_DIR = path.join(__dirname, "..");
const dataDir = process.env.MYOGI_BAN_DATA_DIR
  ? path.resolve(process.env.MYOGI_BAN_DATA_DIR)
  : path.join(ROOT_DIR, "public");
const pidFile = path.join(dataDir, "server.pid");

const server = createLocalServer({
  port: PORT,
  publicDir: path.join(ROOT_DIR, "public"),
  builtinLayoutDir: path.join(ROOT_DIR, "public", "layout"),
  userLayoutDir: path.join(dataDir, "user-layouts"),
  defaultLayoutFile: path.join(dataDir, "default-layout.json"),
  pidFile,
  updateManager: new UpdateManager({
    currentVersion: process.env.npm_package_version ?? "0.0.0",
  }),
  onListening: () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`OBS browser source URL: http://localhost:${PORT}/view`);
    console.log(`PID: ${process.pid} (saved to ${pidFile})`);
  },
});

const cleanup = () => {
  console.log("\nShutting down...");
  server.close(() => {
    process.exit(0);
  });
};

process.on("SIGTERM", cleanup);
process.on("SIGINT", cleanup);
