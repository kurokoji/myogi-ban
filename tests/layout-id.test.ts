import assert from "node:assert/strict";
import test from "node:test";
import { createLayoutId, isGeneratedLayoutId } from "../src/layout-id";

test("createLayoutId returns a distinct id each time", () => {
  const ids = new Set(Array.from({ length: 50 }, () => createLayoutId()));

  assert.equal(ids.size, 50);
});

test("createLayoutId returns a directory-safe id", () => {
  for (const id of Array.from({ length: 20 }, () => createLayoutId())) {
    assert.match(id, /^[0-9a-f-]+$/);
    assert.equal(isGeneratedLayoutId(id), true);
  }
});

test("isGeneratedLayoutId rejects ids that came from a layout name", () => {
  assert.equal(isGeneratedLayoutId("hit-box-ultra"), false);
  assert.equal(isGeneratedLayoutId("mypreset"), false);
  assert.equal(isGeneratedLayoutId(""), false);
});
