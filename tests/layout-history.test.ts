import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultLayout } from "../src/layout";
import { areLayoutSnapshotsEqual } from "../src/layout-history";
import { createLayoutSnapshotSignature } from "../src/layout-snapshot";

test("areLayoutSnapshotsEqual compares serialized layout state", () => {
  const first = createDefaultLayout();
  const second = createDefaultLayout();
  assert.equal(areLayoutSnapshotsEqual(first, second), true);
  second.background.opacity = 0.5;
  assert.equal(areLayoutSnapshotsEqual(first, second), false);
});

test("createLayoutSnapshotSignature optionally includes mappings", () => {
  const layout = createDefaultLayout();
  assert.notEqual(
    createLayoutSnapshotSignature(layout),
    createLayoutSnapshotSignature(layout, [1], [2]),
  );
});
