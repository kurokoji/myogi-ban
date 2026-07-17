import assert from "node:assert/strict";
import { join } from "node:path";
import test from "node:test";
import { resolveElectronDataDir } from "../src/data-paths";

test("resolveElectronDataDir separates development and product data", () => {
  assert.equal(
    resolveElectronDataDir(true, "/app", "/user"),
    join("/app", ".dev-data"),
  );
  assert.equal(resolveElectronDataDir(false, "/app", "/user"), "/user");
});
