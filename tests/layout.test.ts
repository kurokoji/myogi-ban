import assert from "node:assert/strict";
import test from "node:test";
import { ensureLayoutDefaults } from "../src/layout";

test("ensureLayoutDefaults fills missing nested values", () => {
  const layout = ensureLayoutDefaults({
    version: "v1.0.5",
    name: "legacy",
    background: { w: "640", h: "360" } as never,
    guides: { vertical: [10], horizontal: [] },
  });

  assert.equal(layout.name, "legacy");
  assert.equal(layout.version, "v1.0.12");
  assert.equal(layout.background.w, "640");
  assert.equal(layout.background.opacity, 1);
  assert.equal(layout.background.scale, "");
  assert.equal(layout.defaultbuttons.cssShape, "circle");
  assert.deepEqual(layout.guides.vertical, [10]);
});

test("ensureLayoutDefaults removes button values duplicated from defaults", () => {
  const layout = ensureLayoutDefaults({
    defaultbuttons: {
      w: "48",
      h: "48",
      img: "released.png",
      imgp: "pressed.png",
      rotation: "15",
      cssShape: "rounded",
      cssTextColor: "#111111",
      cssTextSize: "20",
      cssTextBold: true,
      cssTextItalic: true,
      cssTextOutline: true,
      cssTextOutlineColor: "#00ff00",
    } as never,
    buttons: [
      {
        w: "48",
        h: "48",
        img: "released.png",
        imgp: "pressed.png",
        rotation: "15",
        cssShape: "rounded",
        cssTextColor: "#111111",
        cssTextSize: "20",
        cssTextBold: true,
        cssTextItalic: true,
        cssTextOutline: true,
        cssTextOutlineColor: "#00ff00",
      } as never,
    ],
  });

  assert.equal(layout.buttons[0].w, "");
  assert.equal(layout.buttons[0].h, "");
  assert.equal(layout.buttons[0].img, "");
  assert.equal(layout.buttons[0].rotation, undefined);
  assert.equal(layout.buttons[0].cssShape, undefined);
  assert.equal(layout.buttons[0].cssTextColor, undefined);
  assert.equal(layout.buttons[0].cssTextSize, undefined);
  assert.equal(layout.buttons[0].cssTextBold, undefined);
  assert.equal(layout.buttons[0].cssTextItalic, undefined);
  assert.equal(layout.buttons[0].cssTextOutline, undefined);
  assert.equal(layout.buttons[0].cssTextOutlineColor, undefined);
});
