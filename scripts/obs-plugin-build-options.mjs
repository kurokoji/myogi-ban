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

export function resolveCmakeCommand(options) {
  const command =
    options.configuredCommand ??
    options.pathCommand ??
    options.visualStudioCommand;
  if (!command) throw new Error("CMake was not found.");
  return command;
}
