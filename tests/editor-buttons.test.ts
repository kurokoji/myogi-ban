import assert from "node:assert/strict";
import test from "node:test";
import {
  addEditorButton,
  deleteEditorButtons,
  duplicateEditorButtons,
  reorderEditorButtons,
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

test("duplicateEditorButtons appends offset copies with unassigned mappings", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 2;
  layout.buttons[0].x = "100";
  layout.buttons[0].y = "50";
  layout.buttons[0].cssColor = "#ff0000";
  const result = duplicateEditorButtons(layout, [3, 4], [0]);

  assert.deepEqual(result?.indexes, [2]);
  assert.equal(result?.layout.totalbuttonshow, 3);
  assert.equal(result?.layout.buttons[2].x, "116");
  assert.equal(result?.layout.buttons[2].y, "66");
  assert.equal(result?.layout.buttons[2].cssColor, "#ff0000");
  assert.deepEqual(result?.mapping, [3, 4, -1]);
  assert.equal(layout.totalbuttonshow, 2);
});

test("duplicateEditorButtons copies only as many buttons as the limit allows", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 3;
  const result = duplicateEditorButtons(layout, [0, 1, 2], [0, 1, 2], 4);

  assert.deepEqual(result?.indexes, [3]);
  assert.equal(result?.layout.totalbuttonshow, 4);
  assert.equal(
    duplicateEditorButtons(result?.layout ?? layout, [], [0], 4),
    null,
  );
});

test("reorderEditorButtons brings selected buttons to the front with mappings", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 4;
  layout.buttons.slice(0, 4).forEach((button, index) => {
    button.x = String(index);
  });
  const result = reorderEditorButtons(
    layout,
    [10, 11, 12, 13],
    [0, 2],
    "front",
  );

  assert.deepEqual(
    result.layout.buttons.slice(0, 4).map((button) => button.x),
    ["1", "3", "0", "2"],
  );
  assert.deepEqual(result.mapping, [11, 13, 10, 12]);
  assert.deepEqual(result.indexes, [2, 3]);
  assert.equal(layout.buttons[0].x, "0");
});

test("reorderEditorButtons sends selected buttons to the back in stable order", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 4;
  layout.buttons.slice(0, 4).forEach((button, index) => {
    button.x = String(index);
  });
  const result = reorderEditorButtons(layout, [10, 11, 12, 13], [1, 3], "back");

  assert.deepEqual(
    result.layout.buttons.slice(0, 4).map((button) => button.x),
    ["1", "3", "0", "2"],
  );
  assert.deepEqual(result.mapping, [11, 13, 10, 12]);
  assert.deepEqual(result.indexes, [0, 1]);
});
