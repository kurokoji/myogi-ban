import assert from "node:assert/strict";
import test from "node:test";
import { createElectronDevSpawnOptions } from "../scripts/electron-dev-options.mjs";

test("Electron development spawn enables dev mode and Linux libraries", () => {
  const options = createElectronDevSpawnOptions({
    electronPath: "/app/electron",
    platform: "linux",
    cwd: "/project",
    env: { LD_LIBRARY_PATH: "/system/lib" },
  });

  assert.equal(options.command, "/app/electron");
  assert.deepEqual(options.args, [".", "--dev"]);
  assert.equal(
    options.env.LD_LIBRARY_PATH,
    "/project/.libs/usr/lib/x86_64-linux-gnu:/system/lib",
  );
});
