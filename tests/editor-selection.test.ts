import assert from "node:assert/strict";
import test from "node:test";
import {
  createButtonSelection,
  EMPTY_EDITOR_SELECTION,
  normalizeEditorSelection,
  toggleButtonInSelection,
  toggleSelectedIndex,
} from "../src/editor-selection";

test("toggleSelectedIndex adds an unselected index", () => {
  assert.deepEqual(toggleSelectedIndex([1, 3], 2), [1, 3, 2]);
});

test("EditorSelection keeps all selection fields in one value", () => {
  assert.deepEqual(createButtonSelection(2), {
    buttonIndexes: [2],
    primaryButtonIndex: 2,
    stick: false,
  });
  assert.deepEqual(
    toggleButtonInSelection(createButtonSelection(2), 2),
    EMPTY_EDITOR_SELECTION,
  );
});

test("toggleSelectedIndex removes a selected index", () => {
  assert.deepEqual(toggleSelectedIndex([1, 3, 2], 3), [1, 2]);
});

test("normalizeEditorSelection removes indexes outside the visible buttons", () => {
  assert.deepEqual(normalizeEditorSelection([1, 8], 8, 8), {
    buttonIndexes: [1],
    primaryIndex: null,
    cancelAssignment: true,
  });
});
