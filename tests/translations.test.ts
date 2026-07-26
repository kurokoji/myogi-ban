import assert from "node:assert/strict";
import test from "node:test";
import { enTranslation } from "../src/translations/en";
import { jaTranslation } from "../src/translations/ja";
import { isTranslationKey } from "../src/translations/keys";

test("split translations preserve representative Japanese and English values", () => {
  assert.equal(jaTranslation.save, "保存");
  assert.equal(enTranslation.save, "Save");
  assert.equal(jaTranslation.shapePill, "カプセル");
  assert.equal(enTranslation.shapePill, "Pill");
  assert.deepEqual(Object.keys(jaTranslation), Object.keys(enTranslation));
});

test("isTranslationKey distinguishes known translation keys", () => {
  assert.equal(isTranslationKey("save"), true);
  assert.equal(isTranslationKey("missing-key"), false);
});
