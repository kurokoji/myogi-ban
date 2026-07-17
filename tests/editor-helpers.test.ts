import assert from "node:assert/strict";
import test from "node:test";
import {
  cloneLayout,
  createSignedRulerTicks,
  updateSelectedButtonSettings,
} from "../src/editor-helpers";
import { createDefaultLayout } from "../src/layout";

test("createSignedRulerTicks creates symmetric ticks including zero", () => {
  assert.deepEqual(createSignedRulerTicks(25, 10), [-20, -10, 0, 10, 20]);
  assert.deepEqual(createSignedRulerTicks(0), [0]);
});

test("updateSelectedButtonSettings applies changed settings to every selected button", () => {
  const layout = createDefaultLayout();
  layout.buttons[0].cssColor = "#111111";
  layout.buttons[1].cssColor = "#222222";
  layout.buttons[0].cssShape = "circle";
  layout.buttons[1].cssShape = "square";

  updateSelectedButtonSettings(layout, [0, 1], (next) => {
    next.buttons[0].cssColor = "#abcdef";
    next.buttons[0].cssShape = "rounded";
  });

  assert.equal(layout.buttons[0].cssColor, "#abcdef");
  assert.equal(layout.buttons[1].cssColor, "#abcdef");
  assert.equal(layout.buttons[0].cssShape, "rounded");
  assert.equal(layout.buttons[1].cssShape, "rounded");
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
