import assert from "node:assert/strict";
import test from "node:test";
import {
  canReplaceCurrentLayout,
  cloneLayout,
  isStickAssignmentTarget,
  updateSelectedButtonSettings,
} from "../src/editor-helpers";
import { createDefaultLayout } from "../src/layout";
import { createSignedRulerTicks } from "../src/ruler-ticks";

test("createSignedRulerTicks creates symmetric ticks including zero", () => {
  assert.deepEqual(createSignedRulerTicks(25, 10), [-20, -10, 0, 10, 20]);
  assert.deepEqual(createSignedRulerTicks(0), [0]);
});

test("isStickAssignmentTarget distinguishes stick targets from button targets", () => {
  assert.equal(isStickAssignmentTarget(null), false);
  assert.equal(isStickAssignmentTarget(0), false);
  assert.equal(isStickAssignmentTarget(999), false);
  assert.equal(isStickAssignmentTarget(1000), true);
  assert.equal(isStickAssignmentTarget(1003), true);
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

test("updateSelectedButtonSettings preserves settings that were not changed", () => {
  const layout = createDefaultLayout();
  layout.buttons[0].w = "40";
  layout.buttons[1].w = "80";

  updateSelectedButtonSettings(layout, [0, 1], (next) => {
    next.buttons[0].cssColor = "#abcdef";
  });

  assert.equal(layout.buttons[0].w, "40");
  assert.equal(layout.buttons[1].w, "80");
});

test("updateSelectedButtonSettings removes an undefined setting from every selected button", () => {
  const layout = createDefaultLayout();
  layout.buttons[0].rotation = "10";
  layout.buttons[1].rotation = "20";

  updateSelectedButtonSettings(layout, [0, 1], (next) => {
    delete next.buttons[0].rotation;
  });

  assert.equal(layout.buttons[0].rotation, undefined);
  assert.equal(layout.buttons[1].rotation, undefined);
});

test("updateSelectedButtonSettings creates missing selected button settings", () => {
  const layout = createDefaultLayout();
  layout.buttons[1] = undefined as never;

  updateSelectedButtonSettings(layout, [0, 1], (next) => {
    next.buttons[0].cssColor = "#abcdef";
  });

  assert.equal(layout.buttons[1].cssColor, "#abcdef");
  assert.equal(layout.buttons[1].x, "");
  assert.equal(layout.buttons[1].y, "");
});

test("updateSelectedButtonSettings does nothing when no buttons are selected", () => {
  const layout = createDefaultLayout();
  const before = JSON.stringify(layout);
  let updaterCalled = false;

  updateSelectedButtonSettings(layout, [], () => {
    updaterCalled = true;
  });

  assert.equal(updaterCalled, false);
  assert.equal(JSON.stringify(layout), before);
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

test("canReplaceCurrentLayout only asks before discarding unsaved changes", () => {
  let confirmations = 0;
  const confirmDiscard = () => {
    confirmations += 1;
    return false;
  };

  assert.equal(canReplaceCurrentLayout(false, confirmDiscard), true);
  assert.equal(confirmations, 0);
  assert.equal(canReplaceCurrentLayout(true, confirmDiscard), false);
  assert.equal(confirmations, 1);
});
