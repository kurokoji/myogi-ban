import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createObsPluginConfigureArgs,
  resolveCmakeCommand,
} from "../scripts/obs-plugin-build-options.mjs";

test("OBS plugin configure points CMake at the plugin and OBS SDK", () => {
  assert.deepEqual(
    createObsPluginConfigureArgs({
      sourceDir: "obs-plugin",
      buildDir: "build/obs-plugin",
      obsSdkDir: "C:/obs-deps",
      version: "1.0.12",
    }),
    [
      "-S",
      "obs-plugin",
      "-B",
      "build/obs-plugin",
      "-DOBS_SDK_DIR=C:/obs-deps",
      "-DMYOGI_BAN_VERSION=1.0.12",
      "-A",
      "x64",
    ],
  );
});

test("OBS plugin build uses Visual Studio CMake when it is not on PATH", () => {
  assert.equal(
    resolveCmakeCommand({
      configuredCommand: undefined,
      pathCommand: undefined,
      visualStudioCommand: "C:/Visual Studio/CMake/bin/cmake.exe",
    }),
    "C:/Visual Studio/CMake/bin/cmake.exe",
  );
});

test("OBS plugin build uses the application version", async () => {
  const buildScript = await readFile("scripts/build-obs-plugin.mjs", "utf8");
  const cmake = await readFile("obs-plugin/CMakeLists.txt", "utf8");

  assert.match(buildScript, /packageJson\.version/);
  assert.match(buildScript, /version: packageJson\.version/);
  assert.match(cmake, /project\(myogi-ban-obs VERSION \$\{MYOGI_BAN_VERSION\}/);
  assert.doesNotMatch(cmake, /VERSION 1\.0\.0/);
});
