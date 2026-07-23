import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  createObsPluginConfigureArgs,
  resolveCmakeCommand,
} from "./obs-plugin-build-options.mjs";

const obsSdkDir = process.env.OBS_SDK_DIR;
if (!obsSdkDir) {
  throw new Error(
    "OBS_SDK_DIR must point to an OBS SDK containing the libobs CMake package.",
  );
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

const pathLookup = spawnSync("where.exe", ["cmake.exe"], {
  encoding: "utf8",
});
const pathCommand =
  pathLookup.status === 0 ? pathLookup.stdout.split(/\r?\n/, 1)[0] : undefined;
const visualStudioRoots = ["18", "17"].map((version) =>
  join(
    process.env["ProgramFiles(x86)"] ?? "C:/Program Files (x86)",
    "Microsoft Visual Studio",
    version,
    "BuildTools",
    "Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe",
  ),
);
const cmake = resolveCmakeCommand({
  configuredCommand: process.env.CMAKE_COMMAND,
  pathCommand,
  visualStudioCommand: visualStudioRoots.find(existsSync),
});

const buildDir = "build/obs-plugin";
run(
  cmake,
  createObsPluginConfigureArgs({
    sourceDir: "obs-plugin",
    buildDir,
    obsSdkDir,
  }),
);
run(cmake, ["--build", buildDir, "--config", "RelWithDebInfo"]);
