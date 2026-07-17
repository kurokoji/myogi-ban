import assert from "node:assert/strict";
import test from "node:test";
import { guideCoordinateFromPointer } from "../src/editor-guides";

test("guideCoordinateFromPointer converts screen coordinates using origin and scale", () => {
  assert.equal(guideCoordinateFromPointer(350, 100, 50, 2), 100);
});
