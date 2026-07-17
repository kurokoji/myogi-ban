import assert from "node:assert/strict";
import test from "node:test";
import { resetButtonToDefaults } from "../src/button-settings";
import { createDefaultLayout } from "../src/layout";

test("resetButtonToDefaults preserves position and copies default appearance", () => {
  const layout = createDefaultLayout();
  layout.buttons[0].x = "12";
  layout.buttons[0].y = "34";
  layout.buttons[0].cssColor = "#000000";

  const result = resetButtonToDefaults(
    layout.buttons[0],
    layout.defaultbuttons,
  );

  assert.equal(result.x, "12");
  assert.equal(result.y, "34");
  assert.equal(result.cssColor, layout.defaultbuttons.cssColor);
  assert.equal(result.w, layout.defaultbuttons.w);
});
