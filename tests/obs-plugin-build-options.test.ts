import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  createObsPluginConfigureArgs,
  createObsPluginNativeTestConfigureArgs,
  createObsPluginTestArgs,
  resolveCmakeCommand,
  resolveCtestCommand,
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

test("OBS plugin build runs native tests from the configured build", () => {
  assert.deepEqual(createObsPluginTestArgs("build/obs-plugin"), [
    "--test-dir",
    "build/obs-plugin",
    "-C",
    "RelWithDebInfo",
    "--output-on-failure",
  ]);
});

test("native OBS tests configure without an OBS SDK or Visual Studio architecture", () => {
  assert.deepEqual(
    createObsPluginNativeTestConfigureArgs({
      sourceDir: "obs-plugin",
      buildDir: "build/obs-plugin-tests",
      version: "1.0.14",
    }),
    [
      "-S",
      "obs-plugin",
      "-B",
      "build/obs-plugin-tests",
      "-DMYOGI_BAN_VERSION=1.0.14",
      "-DMYOGI_BAN_BUILD_PLUGIN=OFF",
    ],
  );
});

test("CTest command follows the host platform", () => {
  assert.equal(
    resolveCtestCommand("C:/tools/cmake.exe", "win32"),
    "C:\\tools\\ctest.exe",
  );
  assert.equal(
    resolveCtestCommand("/usr/bin/cmake", "linux"),
    "/usr/bin/ctest",
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
