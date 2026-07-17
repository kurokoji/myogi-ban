import assert from "node:assert/strict";
import test from "node:test";
import { isLayoutNameTaken, normalizeLayoutName } from "../src/layout-name";

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
