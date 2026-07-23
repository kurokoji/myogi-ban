import { join } from "node:path";

export function createObsPluginInstallerDefines(options) {
  const outputFile = join(
    options.outputDirectory,
    `Myogi-Ban-OBS-Plugin-Setup-${options.version}.exe`,
  );
  return [
    `/DAPP_VERSION=${options.version}`,
    `/DPLUGIN_DLL=${options.pluginDll}`,
    `/DPLUGIN_DATA=${options.pluginData}`,
    `/DOUTPUT_FILE=${outputFile}`,
  ];
}
