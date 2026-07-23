import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createObsPluginInstallerDefines } from "./obs-plugin-installer-options.mjs";

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

function findExecutable(directory, filename) {
  if (!directory || !existsSync(directory)) return undefined;
  for (const entry of readdirSync(directory, {
    recursive: true,
    withFileTypes: true,
  })) {
    if (entry.isFile() && entry.name.toLowerCase() === filename) {
      return join(entry.parentPath, entry.name);
    }
  }
  return undefined;
}

function resolveMakensis() {
  if (process.env.MAKENSIS_COMMAND) return process.env.MAKENSIS_COMMAND;
  const lookup = spawnSync("where.exe", ["makensis.exe"], { encoding: "utf8" });
  if (lookup.status === 0) return lookup.stdout.split(/\r?\n/, 1)[0];
  return findExecutable(
    join(process.env.LOCALAPPDATA ?? "", "electron-builder", "Cache"),
    "makensis.exe",
  );
}

const pluginDll = resolve("build/obs-plugin/RelWithDebInfo/myogi-ban-obs.dll");
const pluginData = resolve("obs-plugin/data");
const outputDirectory = resolve("release");
const installerScript = resolve("obs-plugin/installer.nsi");
const makensis = resolveMakensis();

if (!existsSync(pluginDll))
  throw new Error(`Plugin DLL not found: ${pluginDll}`);
if (!makensis) throw new Error("makensis.exe was not found.");
mkdirSync(outputDirectory, { recursive: true });

const result = spawnSync(
  makensis,
  [
    ...createObsPluginInstallerDefines({
      version: packageJson.version,
      pluginDll,
      pluginData,
      outputDirectory,
    }),
    installerScript,
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
