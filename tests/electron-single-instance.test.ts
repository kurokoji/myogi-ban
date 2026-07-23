import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Electron routes later launches to the existing process", async () => {
  const source = await readFile("src/electron.ts", "utf8");

  assert.match(source, /app\.requestSingleInstanceLock\(\)/);
  assert.match(source, /app\.on\("second-instance"/);
  assert.match(source, /shouldOpenWindowForSecondInstance\(commandLine\)/);
  assert.match(source, /mainWindow\.isMinimized\(\)/);
  assert.match(source, /mainWindow\.restore\(\)/);
  assert.match(source, /mainWindow\.focus\(\)/);
  assert.match(source, /if \(!hasSingleInstanceLock\) app\.quit\(\)/);
});
