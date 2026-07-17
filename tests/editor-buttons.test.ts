import assert from "node:assert/strict";
import test from "node:test";
import { addEditorButton, deleteEditorButtons } from "../src/editor-buttons";
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
