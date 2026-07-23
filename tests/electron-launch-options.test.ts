import assert from "node:assert/strict";
import test from "node:test";
import { resolveElectronLaunchOptions } from "../src/electron-launch-options";

test("Electron opens a window by default", () => {
  assert.deepEqual(resolveElectronLaunchOptions([]), {
    development: false,
    serverOnly: false,
  });
});

test("Electron skips the window in server-only mode", () => {
  assert.deepEqual(resolveElectronLaunchOptions(["--server-only"]), {
    development: false,
    serverOnly: true,
  });
});

test("Electron recognizes launch options alongside other arguments", () => {
  assert.deepEqual(
    resolveElectronLaunchOptions(["app-path", "--dev", "--server-only"]),
    {
      development: true,
      serverOnly: true,
    },
  );
});
