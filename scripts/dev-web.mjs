import { spawn } from "node:child_process";
import { context } from "esbuild";
import { createServer } from "vite";
import { createRestartableProcess } from "./dev-process.mjs";

let serverProcess;
const serverBuild = await context({
  entryPoints: ["src/server.ts"],
  bundle: true,
  platform: "node",
  external: ["ws", "express"],
  outfile: "dist/server.js",
  plugins: [
    {
      name: "restart-server",
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length === 0 && serverProcess) {
            void serverProcess.restart();
          }
        });
      },
    },
  ],
});

await serverBuild.rebuild();
await serverBuild.watch();

serverProcess = createRestartableProcess(
  () =>
    spawn(process.execPath, ["dist/server.js"], {
      stdio: "inherit",
      env: { ...process.env, MYOGI_BAN_DATA_DIR: ".dev-data" },
    }),
  {
    onUnexpectedExit(code, signal) {
      console.error(
        `Development server exited unexpectedly (${code ?? signal})`,
      );
      void serverBuild.dispose().then(() => {
        process.exitCode = code ?? 1;
      });
    },
  },
);
serverProcess.start();

const vite = await createServer();
await vite.listen();
vite.printUrls();

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await serverProcess.stop();
  await vite.close();
  await serverBuild.dispose();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
