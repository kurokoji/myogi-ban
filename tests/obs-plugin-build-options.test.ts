import assert from "node:assert/strict";
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
    }),
    [
      "-S",
      "obs-plugin",
      "-B",
      "build/obs-plugin",
      "-DOBS_SDK_DIR=C:/obs-deps",
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
