import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultLayout } from "../src/layout";
import { CURRENT_LAYOUT_VERSION } from "../src/layout-migration";
import {
  buildLayoutForSave,
  createEditorSnapshotSignature,
} from "../src/layout-save";

test("buildLayoutForSave applies the save name and current mappings", () => {
  const saved = buildLayoutForSave(
    createDefaultLayout(),
    "custom",
    [3, 4],
    [10, 11, 12, 13],
  );

  assert.equal(saved.name, "custom");
  assert.deepEqual(saved.buttonMappings, [3, 4]);
  assert.deepEqual(saved.stickMappings, [10, 11, 12, 13]);
});

test("buildLayoutForSave does not share mutable data with its inputs", () => {
  const layout = createDefaultLayout();
  const buttonMappings = [1, 2];
  const stickMappings = [3, 4, 5, 6];

  const saved = buildLayoutForSave(
    layout,
    "custom",
    buttonMappings,
    stickMappings,
  );
  saved.background.w = "999";
  saved.buttons[0].x = "999";
  saved.guides.vertical.push(99);
  saved.buttonMappings?.push(99);
  saved.stickMappings?.push(99);

  assert.notEqual(saved.background, layout.background);
  assert.notEqual(saved.buttons[0], layout.buttons[0]);
  assert.notEqual(saved.guides, layout.guides);
  assert.equal(layout.background.w, "500");
  assert.notEqual(layout.buttons[0].x, "999");
  assert.deepEqual(layout.guides.vertical, []);
  assert.deepEqual(buttonMappings, [1, 2]);
  assert.deepEqual(stickMappings, [3, 4, 5, 6]);
});

test("buildLayoutForSave uses the current layout format version", () => {
  const layout = createDefaultLayout();
  layout.version = "v1.0.5";

  const saved = buildLayoutForSave(layout, "custom", [], []);

  assert.equal(saved.version, CURRENT_LAYOUT_VERSION);
  assert.equal(layout.version, "v1.0.5");
});

test("createEditorSnapshotSignature detects layout and mapping changes", () => {
  const layout = createDefaultLayout();
  const original = createEditorSnapshotSignature(layout, [1], [2]);

  assert.equal(createEditorSnapshotSignature(layout, [1], [2]), original);
  assert.notEqual(createEditorSnapshotSignature(layout, [3], [2]), original);
  assert.notEqual(
    createEditorSnapshotSignature({ ...layout, name: "changed" }, [1], [2]),
    original,
  );
});
