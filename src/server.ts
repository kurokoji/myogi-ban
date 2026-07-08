import * as path from "path";
import { createLocalServer } from "./local-server";
import { PORT } from "./types";

const ROOT_DIR = path.join(__dirname, "..");
const PID_FILE = path.join(ROOT_DIR, "server.pid");

const server = createLocalServer({
  port: PORT,
  publicDir: path.join(ROOT_DIR, "public"),
  builtinLayoutDir: path.join(ROOT_DIR, "public", "layout"),
  userLayoutDir: path.join(ROOT_DIR, "public", "user-layouts"),
  defaultLayoutFile: path.join(ROOT_DIR, "public", "default-layout.json"),
  pidFile: PID_FILE,
  onListening: () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`OBS browser source URL: http://localhost:${PORT}/view`);
    console.log(`PID: ${process.pid} (saved to ${PID_FILE})`);
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
