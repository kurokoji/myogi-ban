import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { context } from "esbuild";
import { createRestartableProcess } from "./dev-process.mjs";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const editor = await context({
  entryPoints: ["src/editor.tsx"],
  bundle: true,
  sourcemap: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
    "process.env.npm_package_version": JSON.stringify(pkg.version),
  },
  outfile: "public/js/editor.js",
});

const viewer = await context({
  entryPoints: ["src/viewer.tsx"],
  bundle: true,
  sourcemap: true,
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
  },
  outfile: "public/js/viewer.js",
});

let serverProcess;
const server = await context({
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
          if (result.errors.length === 0 && serverProcess)
            void serverProcess.restart();
        });
      },
    },
  ],
});

await Promise.all([editor.rebuild(), viewer.rebuild(), server.rebuild()]);
await Promise.all([editor.watch(), viewer.watch(), server.watch()]);

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
      void Promise.all([
        editor.dispose(),
        viewer.dispose(),
        server.dispose(),
      ]).then(() => {
        process.exitCode = code ?? 1;
      });
    },
  },
);
serverProcess.start();

let shuttingDown = false;
async function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  await serverProcess.stop();
  await Promise.all([editor.dispose(), viewer.dispose(), server.dispose()]);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
