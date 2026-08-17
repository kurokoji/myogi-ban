import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultLayout } from "../src/layout";
import { withUploadedImage } from "../src/layout-image";

test("withUploadedImage updates the background without mutating the input", () => {
  const layout = createDefaultLayout();
  const updated = withUploadedImage(
    layout,
    { type: "background" },
    "custom",
    "background.png",
  );

  assert.equal(updated.id, "custom");
  assert.equal(updated.name, layout.name);
  assert.equal(updated.background.image, "background.png");
  assert.equal(layout.background.image, "");
});

test("withUploadedImage updates default and selected button image states", () => {
  const layout = createDefaultLayout();
  const withDefault = withUploadedImage(
    layout,
    { type: "defaultButton", state: "pressed" },
    "custom",
    "default-pressed.png",
  );
  const withButtons = withUploadedImage(
    withDefault,
    { type: "button", indexes: [0, 2], state: "released" },
    "custom",
    "released.png",
  );

  assert.equal(withButtons.defaultbuttons.imgp, "default-pressed.png");
  assert.equal(withButtons.buttons[0].img, "released.png");
  assert.equal(withButtons.buttons[1].img, "");
  assert.equal(withButtons.buttons[2].img, "released.png");
});
