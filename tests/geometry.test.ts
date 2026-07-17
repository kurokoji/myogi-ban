import assert from "node:assert/strict";
import test from "node:test";
import { dragPosition, rectsIntersect } from "../src/geometry";

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

test("dragPosition applies pointer delta and rounds coordinates", () => {
  assert.deepEqual(
    dragPosition({ x: 100, y: 50 }, { x: 10, y: 20 }, { x: 15.4, y: 17.6 }),
    { x: 105, y: 48 },
  );
});
