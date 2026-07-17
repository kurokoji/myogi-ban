import assert from "node:assert/strict";
import test from "node:test";
import { toggleSelectedIndex } from "../src/editor-selection";

test("toggleSelectedIndex adds an unselected index", () => {
  assert.deepEqual(toggleSelectedIndex([1, 3], 2), [1, 3, 2]);
});

test("toggleSelectedIndex removes a selected index", () => {
  assert.deepEqual(toggleSelectedIndex([1, 3, 2], 3), [1, 2]);
});
