import assert from "node:assert/strict";
import test from "node:test";
import { rectsIntersect } from "../src/geometry";

test("rectsIntersect detects overlap and touching edges", () => {
  const rect = { left: 0, top: 0, right: 10, bottom: 10 };
  assert.equal(
    rectsIntersect(rect, { left: 5, top: 5, right: 15, bottom: 15 }),
    true,
  );
  assert.equal(
    rectsIntersect(rect, { left: 10, top: 2, right: 20, bottom: 8 }),
    true,
  );
});

test("rectsIntersect rejects separated rectangles", () => {
  const rect = { left: 0, top: 0, right: 10, bottom: 10 };
  assert.equal(
    rectsIntersect(rect, { left: 11, top: 0, right: 20, bottom: 10 }),
    false,
  );
});
