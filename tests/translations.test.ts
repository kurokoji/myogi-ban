import assert from "node:assert/strict";
import test from "node:test";
import { enTranslation } from "../src/translations/en";
import { jaTranslation } from "../src/translations/ja";

test("split translations preserve representative Japanese and English values", () => {
  assert.equal(jaTranslation.save, "保存");
  assert.equal(enTranslation.save, "Save");
  assert.deepEqual(Object.keys(jaTranslation), Object.keys(enTranslation));
});
