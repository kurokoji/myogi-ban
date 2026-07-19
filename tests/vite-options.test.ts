import assert from "node:assert/strict";
import test from "node:test";
import { createViteOptions } from "../scripts/vite-options.mjs";

test("Vite builds both browser entry points and proxies backend traffic", () => {
  const options = createViteOptions({ backendPort: 33770 });

  assert.deepEqual(Object.keys(options.build.rollupOptions.input).sort(), [
    "editor",
    "viewer",
  ]);
  assert.equal(options.build.outDir, "public");
  assert.equal(options.build.emptyOutDir, false);
  assert.equal(options.server.proxy["/api"].target, "http://localhost:33770");
  assert.equal(options.server.proxy["/ws"].ws, true);
});
