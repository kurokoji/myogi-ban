import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { context } from "esbuild";
import { createServer } from "vite";
import { createRestartableProcess } from "./dev-process.mjs";
import { createElectronDevSpawnOptions } from "./electron-dev-options.mjs";

const require = createRequire(import.meta.url);
const electronPath = require("electron");

let electronProcess;
const electronBuild = await context({
  entryPoints: ["src/electron.ts"],
  bundle: true,
  platform: "node",
  external: ["electron", "ws", "express"],
  outfile: "dist/electron.js",
  plugins: [
    {
      name: "restart-electron",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0 && electronProcess) {
            void electronProcess.restart();
          }
        });
      },
    },
  ],
});

await electronBuild.rebuild();
await electronBuild.watch();

const vite = await createServer();
await vite.listen();
vite.printUrls();

let shuttingDown = false;
async function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;
  await electronProcess?.stop();
  await vite.close();
  await electronBuild.dispose();
  if (exitCode !== undefined) process.exitCode = exitCode;
}

electronProcess = createRestartableProcess(
  () => {
    const options = createElectronDevSpawnOptions({
      electronPath,
      platform: process.platform,
      cwd: process.cwd(),
      env: process.env,
    });
    return spawn(options.command, options.args, {
      stdio: "inherit",
      env: options.env,
    });
  },
  {
    onUnexpectedExit(code) {
      void shutdown(code ?? 1);
    },
  },
);
electronProcess.start();

process.on("SIGINT", () => void shutdown());
process.on("SIGTERM", () => void shutdown());
