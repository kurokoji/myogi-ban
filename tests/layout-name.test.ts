import assert from "node:assert/strict";
import test from "node:test";
import {
  isLayoutNameTaken,
  isValidLayoutName,
  normalizeLayoutName,
} from "../src/layout-name";

test("normalizeLayoutName trims whitespace and ignores letter case", () => {
  assert.equal(normalizeLayoutName("  Hit-Box-Ultra  "), "hit-box-ultra");
});

test("isLayoutNameTaken detects an existing user layout", () => {
  assert.equal(
    isLayoutNameTaken(" custom ", [{ name: "Custom", builtin: false }]),
    true,
  );
});

test("isLayoutNameTaken detects an existing built-in layout", () => {
  assert.equal(
    isLayoutNameTaken("PRESET", [{ name: "preset", builtin: true }]),
    true,
  );
});

test("isLayoutNameTaken does not treat a blank name as taken", () => {
  assert.equal(isLayoutNameTaken("   ", [{ name: "", builtin: false }]), false);
});

test("isValidLayoutName rejects blank names", () => {
  assert.equal(isValidLayoutName(""), false);
  assert.equal(isValidLayoutName("   "), false);
});

test("isValidLayoutName rejects path-like and control-character names", () => {
  for (const name of [
    ".",
    "..",
    "../escape",
    "nested/layout",
    "nested\\layout",
    "bad\0name",
    "bad\nname",
  ]) {
    assert.equal(isValidLayoutName(name), false, name);
  }
  assert.equal(isValidLayoutName("PWS FS-24"), true);
  assert.equal(isValidLayoutName("hit-box-ultra-copy"), true);
});
