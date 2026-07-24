import assert from "node:assert/strict";
import test from "node:test";
import { applyEditorResize } from "../src/editor-resize";
import { createDefaultLayout } from "../src/layout";

test("applyEditorResize stores a selected button position and explicit size", () => {
  const layout = createDefaultLayout();
  const resized = applyEditorResize(layout, {
    type: "button",
    index: 0,
    x: 110,
    y: 85,
    width: 80,
    height: 50,
  });

  assert.deepEqual(
    {
      x: resized.buttons[0].x,
      y: resized.buttons[0].y,
      w: resized.buttons[0].w,
      h: resized.buttons[0].h,
    },
    { x: "110", y: "85", w: "80", h: "50" },
  );
  assert.notEqual(resized, layout);
});

test("applyEditorResize converts the stick pixel size to its percentage scale", () => {
  const layout = createDefaultLayout();
  const resized = applyEditorResize(layout, {
    type: "stick",
    index: 0,
    x: 120,
    y: 90,
    width: 144,
    height: 48,
  });

  assert.deepEqual(
    {
      x: resized.stick.x,
      y: resized.stick.y,
      w: resized.stick.w,
      h: resized.stick.h,
    },
    { x: "120", y: "90", w: "150", h: "50" },
  );
});
