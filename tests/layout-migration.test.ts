import assert from "node:assert/strict";
import test from "node:test";
import { CURRENT_LAYOUT_VERSION, migrateLayout } from "../src/layout-migration";

test("migrateLayout upgrades the version without mutating its input", () => {
  const input = { version: "v1.0.5", name: "legacy" };

  const migrated = migrateLayout(input);

  assert.equal(migrated.version, CURRENT_LAYOUT_VERSION);
  assert.equal(input.version, "v1.0.5");
  assert.notEqual(migrated, input);
});

test("migrateLayout preserves legacy background sizing semantics", () => {
  const input = {
    version: "v1.0.5",
    background: { w: "640", h: "360" },
  };

  const migrated = migrateLayout(input as never);

  assert.equal(migrated.background?.scale, "");
  assert.equal("scale" in input.background, false);
});
