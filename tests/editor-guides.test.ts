import assert from "node:assert/strict";
import test from "node:test";
import {
  guideCoordinateFromPointer,
  updateGuidePosition,
} from "../src/editor-guides";

test("guideCoordinateFromPointer converts screen coordinates using origin and scale", () => {
  assert.equal(guideCoordinateFromPointer(350, 100, 50, 2), 100);
});

test("updateGuidePosition moves in-range guides and removes out-of-range guides", () => {
  assert.deepEqual(updateGuidePosition([10, 20], 0, 15, 100), [15, 20]);
  assert.deepEqual(updateGuidePosition([10, 20], 0, -1, 100), [20]);
  assert.deepEqual(updateGuidePosition([10, 20], 1, 101, 100), [10]);
});
