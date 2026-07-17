import assert from "node:assert/strict";
import test from "node:test";
import {
  addEditorButton,
  deleteEditorButtons,
  withButtonPositions,
} from "../src/editor-buttons";
import { createDefaultLayout } from "../src/layout";

test("addEditorButton inserts a button and unassigned mapping", () => {
  const layout = createDefaultLayout();
  const result = addEditorButton(layout, Array(48).fill(0));
  assert.equal(result?.layout.totalbuttonshow, 9);
  assert.equal(result?.mapping[8], -1);
  assert.equal(layout.totalbuttonshow, 8);
});

test("deleteEditorButtons removes selected buttons and mappings", () => {
  const layout = createDefaultLayout();
  const result = deleteEditorButtons(
    layout,
    Array.from({ length: 48 }, (_, i) => i),
    [1, 3],
  );
  assert.equal(result.layout.totalbuttonshow, 6);
  assert.deepEqual(result.mapping.slice(0, 4), [0, 2, 4, 5]);
});

test("withButtonPositions applies a group move in one immutable update", () => {
  const layout = createDefaultLayout();

  const result = withButtonPositions(layout, [
    { index: 1, x: 120, y: 80 },
    { index: 3, x: 240, y: 160 },
  ]);

  assert.equal(result.buttons[1].x, "120");
  assert.equal(result.buttons[1].y, "80");
  assert.equal(result.buttons[3].x, "240");
  assert.equal(result.buttons[3].y, "160");
  assert.notEqual(result, layout);
  assert.notEqual(result.buttons, layout.buttons);
  assert.notEqual(result.buttons[1], layout.buttons[1]);
  assert.notEqual(layout.buttons[1].x, "120");
});
