import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createObsPluginInstallerDefines } from "../scripts/obs-plugin-installer-options.mjs";

test("OBS plugin installer definitions use the application version and build outputs", () => {
  assert.deepEqual(
    createObsPluginInstallerDefines({
      version: "1.0.12",
      pluginDll:
        "C:\\repo\\build\\obs-plugin\\RelWithDebInfo\\myogi-ban-obs.dll",
      pluginData: "C:\\repo\\obs-plugin\\data",
      outputDirectory: "C:\\repo\\release",
    }),
    [
      "/DAPP_VERSION=1.0.12",
      "/DPLUGIN_DLL=C:\\repo\\build\\obs-plugin\\RelWithDebInfo\\myogi-ban-obs.dll",
      "/DPLUGIN_DATA=C:\\repo\\obs-plugin\\data",
      "/DOUTPUT_FILE=C:\\repo\\release\\Myogi-Ban-OBS-Plugin-Setup-1.0.12.exe",
    ],
  );
});

test("OBS plugin installer uses the recommended Windows plugin directory", async () => {
  const installer = await readFile("obs-plugin/installer.nsi", "utf8");
  const packageJson = JSON.parse(await readFile("package.json", "utf8"));

  assert.match(installer, /RequestExecutionLevel admin/);
  assert.match(installer, /Function \.onInit\s+SetShellVarContext all/);
  assert.match(
    installer,
    /StrCpy \$INSTDIR "\$APPDATA\\obs-studio\\plugins\\myogi-ban-obs"/,
  );
  assert.match(
    installer,
    /File "\/oname=myogi-ban-obs\.dll" "\$\{PLUGIN_DLL\}"/,
  );
  assert.match(installer, /File \/r "\$\{PLUGIN_DATA\}\\\*\.\*"/);
  assert.match(installer, /WriteUninstaller "\$INSTDIR\\Uninstall\.exe"/);
  assert.match(
    installer,
    /WriteRegStr HKLM .*"DisplayVersion" "\$\{APP_VERSION\}"/,
  );
  assert.match(
    installer,
    /"UninstallString" "\$\\"\$INSTDIR\\Uninstall\.exe\$\\""/,
  );
  assert.match(installer, /Section "Uninstall"/);
  assert.match(installer, /SetRegView 64/);
  assert.match(installer, /DeleteRegKey HKLM/);
  assert.equal(
    packageJson.scripts["build:obs-plugin-installer"],
    "npm run build:obs-plugin && node scripts/build-obs-plugin-installer.mjs",
  );
});
