import assert from "node:assert/strict";
import test from "node:test";
import {
  addEditorButton,
  deleteEditorButtons,
  distributeEditorButtons,
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

test("distributeEditorButtons spaces selected buttons evenly by x coordinate", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 3;
  layout.buttons[0].x = "90";
  layout.buttons[0].y = "10";
  layout.buttons[1].x = "0";
  layout.buttons[1].y = "20";
  layout.buttons[2].x = "30";
  layout.buttons[2].y = "30";

  const result = distributeEditorButtons(layout, [0, 1, 2], "horizontal");

  assert.deepEqual(
    result?.buttons.slice(0, 3).map((button) => button.x),
    ["90", "0", "45"],
  );
  assert.deepEqual(
    result?.buttons.slice(0, 3).map((button) => button.y),
    ["10", "20", "30"],
  );
  assert.equal(layout.buttons[2].x, "30");
});

test("distributeEditorButtons spaces selected buttons evenly by y coordinate", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 3;
  layout.buttons[0].x = "10";
  layout.buttons[0].y = "100";
  layout.buttons[1].x = "20";
  layout.buttons[1].y = "20";
  layout.buttons[2].x = "30";
  layout.buttons[2].y = "40";

  const result = distributeEditorButtons(layout, [0, 1, 2], "vertical");

  assert.deepEqual(
    result?.buttons.slice(0, 3).map((button) => button.x),
    ["10", "20", "30"],
  );
  assert.deepEqual(
    result?.buttons.slice(0, 3).map((button) => button.y),
    ["100", "20", "60"],
  );
});

test("distributeEditorButtons limits fractional coordinates to three decimals", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 4;
  for (const [index, x] of ["0", "5", "6", "100"].entries()) {
    layout.buttons[index].x = x;
  }

  const result = distributeEditorButtons(layout, [0, 1, 2, 3], "horizontal");

  assert.deepEqual(
    result?.buttons.slice(0, 4).map((button) => button.x),
    ["0", "33.333", "66.667", "100"],
  );
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
