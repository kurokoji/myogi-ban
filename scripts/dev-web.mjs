import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { context } from "esbuild";

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

const server = await context({
  entryPoints: ["src/server.ts"],
  bundle: true,
  platform: "node",
  external: ["ws", "express"],
  outfile: "dist/server.js",
});

await Promise.all([editor.rebuild(), viewer.rebuild(), server.rebuild()]);
await Promise.all([editor.watch(), viewer.watch()]);

const serverProcess = spawn(process.execPath, ["dist/server.js"], {
  stdio: "inherit",
});

async function shutdown() {
  serverProcess.kill("SIGTERM");
  await Promise.all([editor.dispose(), viewer.dispose(), server.dispose()]);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

serverProcess.on("exit", async (code) => {
  await Promise.all([editor.dispose(), viewer.dispose(), server.dispose()]);
  process.exitCode = code ?? 0;
});
