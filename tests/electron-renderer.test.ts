import assert from "node:assert/strict";
import test from "node:test";
import { resolveElectronRendererUrl } from "../src/electron-renderer";

test("Electron uses the Vite renderer during development", () => {
  assert.equal(
    resolveElectronRendererUrl({ development: true, serverPort: 33770 }),
    "http://localhost:5173",
  );
});

test("Electron uses the Express renderer in production", () => {
  assert.equal(
    resolveElectronRendererUrl({ development: false, serverPort: 33770 }),
    "http://localhost:33770",
  );
});
