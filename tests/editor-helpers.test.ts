import assert from "node:assert/strict";
import test from "node:test";
import { cloneLayout, createSignedRulerTicks } from "../src/editor-helpers";
import { createDefaultLayout } from "../src/layout";

test("createSignedRulerTicks creates symmetric ticks including zero", () => {
  assert.deepEqual(createSignedRulerTicks(25, 10), [-20, -10, 0, 10, 20]);
  assert.deepEqual(createSignedRulerTicks(0), [0]);
});

test("cloneLayout creates independent nested collections", () => {
  const original = createDefaultLayout();
  const cloned = cloneLayout(original);

  cloned.buttons[0].x = "999";
  cloned.guides.vertical.push(42);
  cloned.background.cssColor = "#000000";

  assert.notEqual(cloned.buttons[0].x, original.buttons[0].x);
  assert.deepEqual(original.guides.vertical, []);
  assert.notEqual(cloned.background.cssColor, original.background.cssColor);
});
