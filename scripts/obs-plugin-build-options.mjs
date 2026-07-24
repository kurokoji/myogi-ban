import { posix, win32 } from "node:path";

export function createObsPluginConfigureArgs(options) {
  return [
    "-S",
    options.sourceDir,
    "-B",
    options.buildDir,
    `-DOBS_SDK_DIR=${options.obsSdkDir}`,
    `-DMYOGI_BAN_VERSION=${options.version}`,
    "-A",
    "x64",
  ];
}

export function createObsPluginNativeTestConfigureArgs(options) {
  return [
    "-S",
    options.sourceDir,
    "-B",
    options.buildDir,
    `-DMYOGI_BAN_VERSION=${options.version}`,
    "-DMYOGI_BAN_BUILD_PLUGIN=OFF",
  ];
}

export function createObsPluginTestArgs(buildDir) {
  return [
    "--test-dir",
    buildDir,
    "-C",
    "RelWithDebInfo",
    "--output-on-failure",
  ];
}

export function resolveCtestCommand(cmakeCommand, platform) {
  const paths = platform === "win32" ? win32 : posix;
  const executable = platform === "win32" ? "ctest.exe" : "ctest";
  return paths.join(paths.dirname(cmakeCommand), executable);
}

export function resolveCmakeCommand(options) {
  const command =
    options.configuredCommand ??
    options.pathCommand ??
    options.visualStudioCommand;
  if (!command) throw new Error("CMake was not found.");
  return command;
}
