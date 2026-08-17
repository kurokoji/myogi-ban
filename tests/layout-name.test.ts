import assert from "node:assert/strict";
import test from "node:test";
import {
  isValidLayoutId,
  isValidLayoutName,
  normalizeLayoutName,
} from "../src/layout-name";

test("normalizeLayoutName trims whitespace and ignores letter case", () => {
  assert.equal(normalizeLayoutName("  Hit-Box-Ultra  "), "hit-box-ultra");
});

test("isValidLayoutName rejects blank names", () => {
  assert.equal(isValidLayoutName(""), false);
  assert.equal(isValidLayoutName("   "), false);
});

test("isValidLayoutName accepts anything a user might type", () => {
  for (const name of [
    "PWS FS-24",
    "レバーレス / 2P",
    "..",
    "back\\slash",
    "emoji 🎮 layout",
    "a".repeat(120),
  ]) {
    assert.equal(isValidLayoutName(name), true, name);
  }
});

test("isValidLayoutName rejects names that cannot be shown on one line", () => {
  assert.equal(isValidLayoutName("two\nlines"), false);
  assert.equal(isValidLayoutName("null\0byte"), false);
  assert.equal(isValidLayoutName("a".repeat(201)), false);
});

test("isValidLayoutId rejects ids that would escape the layout directory", () => {
  for (const id of [
    "",
    "   ",
    ".",
    "..",
    "../escape",
    "nested/layout",
    "nested\\layout",
    "bad\0name",
    "bad\nname",
  ]) {
    assert.equal(isValidLayoutId(id), false, id);
  }
});

test("isValidLayoutId accepts generated ids and legacy directory names", () => {
  assert.equal(isValidLayoutId("8f14e45f-ceea-467a-9575-0e02b2c3d479"), true);
  assert.equal(isValidLayoutId("hit-box-ultra"), true);
  assert.equal(isValidLayoutId("PWS FS-24"), true);
});
