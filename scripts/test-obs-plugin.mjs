import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  createObsPluginNativeTestConfigureArgs,
  createObsPluginTestArgs,
  resolveCmakeCommand,
  resolveCtestCommand,
} from "./obs-plugin-build-options.mjs";
import { shouldRunObsTests } from "./test-runner-options.mjs";

if (!shouldRunObsTests(process.platform)) {
  console.log("Skipping OBS native tests outside Windows.");
  process.exit(0);
}

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
);

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function findCmake() {
  const pathLookup = spawnSync("where.exe", ["cmake.exe"], {
    encoding: "utf8",
  });
  const pathCommand =
    pathLookup.status === 0
      ? pathLookup.stdout.split(/\r?\n/, 1)[0]
      : undefined;
  const visualStudioRoots = ["18", "17"].map((version) =>
    join(
      process.env["ProgramFiles(x86)"] ?? "C:/Program Files (x86)",
      "Microsoft Visual Studio",
      version,
      "BuildTools",
      "Common7/IDE/CommonExtensions/Microsoft/CMake/CMake/bin/cmake.exe",
    ),
  );
  return resolveCmakeCommand({
    configuredCommand: process.env.CMAKE_COMMAND,
    pathCommand,
    visualStudioCommand: visualStudioRoots.find(existsSync),
  });
}

const cmake = findCmake();
const buildDir = "build/obs-plugin-tests";
run(
  cmake,
  createObsPluginNativeTestConfigureArgs({
    sourceDir: "obs-plugin",
    buildDir,
    version: packageJson.version,
  }),
);
run(cmake, ["--build", buildDir, "--config", "RelWithDebInfo"]);
run(
  resolveCtestCommand(cmake, process.platform),
  createObsPluginTestArgs(buildDir),
);
