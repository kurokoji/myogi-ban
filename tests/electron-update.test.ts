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

test("the standalone web server wires an UpdateManager without install support", async () => {
  const source = await readFile("src/server.ts", "utf8");
  assert.match(source, /new UpdateManager\(\{/);
  assert.match(
    source,
    /currentVersion: process\.env\.npm_package_version \?\? "0\.0\.0"/,
  );
  assert.doesNotMatch(source, /install:/);
});
