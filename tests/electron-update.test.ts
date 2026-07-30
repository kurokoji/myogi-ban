import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Electron wires an UpdateManager with app-provided version and install capability", async () => {
  const source = await readFile("src/electron.ts", "utf8");
  assert.match(source, /new UpdateManager\(\{/);
  assert.match(source, /currentVersion: app\.getVersion\(\)/);
  assert.match(source, /downloadDirectory: app\.getPath\("temp"\)/);
  assert.match(source, /launchInstaller,/);
  assert.match(
    source,
    /spawn\(installerPath, \[\], \{ detached: true, stdio: "ignore" \}\)\.unref\(\)/,
  );
  assert.match(
    source,
    /function launchInstaller\(installerPath: string\): void \{[\s\S]*?app\.quit\(\);/,
  );
  assert.match(source, /updateManager: new UpdateManager/);
});

test("Electron wires a launchObsPluginInstaller that opens the installer via the shell, without quitting the app", async () => {
  const source = await readFile("src/electron.ts", "utf8");
  assert.match(source, /launchObsPluginInstaller,/);
  const [, obsFnBody] =
    source.match(
      /function launchObsPluginInstaller\(installerPath: string\): void \{([\s\S]*?)\n\}/,
    ) ?? [];
  assert.ok(obsFnBody, "launchObsPluginInstaller body not found");
  // The OBS plugin installer requires admin (RequestExecutionLevel admin in
  // obs-plugin/installer.nsi). child_process.spawn() launches it directly via
  // CreateProcess, which Windows rejects with ERROR_ELEVATION_REQUIRED
  // (surfaced by Node as EACCES) for executables that need elevation.
  // shell.openPath() goes through ShellExecute instead, which triggers the
  // UAC prompt correctly.
  assert.match(obsFnBody as string, /shell\.openPath\(installerPath\)/);
  assert.doesNotMatch(obsFnBody as string, /spawn\(/);
  assert.doesNotMatch(obsFnBody as string, /app\.quit\(\)/);
});

test("Electron wires getInstalledObsPluginVersion into the update manager's install capability", async () => {
  const source = await readFile("src/electron.ts", "utf8");
  assert.match(
    source,
    /import \{ getInstalledObsPluginVersion \} from "\.\/obs-plugin-install-status";/,
  );
  assert.match(source, /getInstalledObsPluginVersion,/);
});

test("Electron wires a WhatsNewManager with app-provided version and a data-dir state file", async () => {
  const source = await readFile("src/electron.ts", "utf8");
  assert.match(source, /new WhatsNewManager\(\{/);
  assert.match(
    source,
    /whatsNewManager: new WhatsNewManager\(\{\s*currentVersion: app\.getVersion\(\),\s*stateFile: path\.join\(dataDir, "last-seen-version\.json"\),/,
  );
});

test("the standalone web server wires an UpdateManager without install support", async () => {
  const source = await readFile("src/server.ts", "utf8");
  assert.match(source, /new UpdateManager\(\{/);
  assert.match(
    source,
    /const currentVersion = process\.env\.npm_package_version \?\? "0\.0\.0";/,
  );
  assert.match(
    source,
    /updateManager: new UpdateManager\(\{ currentVersion \}\)/,
  );
  assert.doesNotMatch(source, /install:/);
});

test("the standalone web server wires a WhatsNewManager with a data-dir state file", async () => {
  const source = await readFile("src/server.ts", "utf8");
  assert.match(source, /new WhatsNewManager\(\{/);
  assert.match(
    source,
    /stateFile: path\.join\(dataDir, "last-seen-version\.json"\)/,
  );
});
