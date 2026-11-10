import assert from "node:assert/strict";
import test from "node:test";
import {
  decodeAxisMapping,
  encodeAxisMapping,
  isAxisMappingTriggered,
} from "../src/axis-mapping";

test("axis mapping encode and decode round trip", () => {
  const code = encodeAxisMapping({ axis: 2, value: -0.75 });
  assert.deepEqual(decodeAxisMapping(code), { axis: 2, value: -0.75 });
});

test("decodeAxisMapping rejects button mapping codes", () => {
  assert.equal(decodeAxisMapping(12), null);
});

test("an axis mapping triggers once the axis travels most of the way to its direction", () => {
  const left = encodeAxisMapping({ axis: 0, value: -1 });
  const right = encodeAxisMapping({ axis: 0, value: 1 });

  assert.equal(isAxisMappingTriggered(left, [-0.9, 0], [0, 0]), true);
  assert.equal(isAxisMappingTriggered(left, [-0.3, 0], [0, 0]), false);
  assert.equal(isAxisMappingTriggered(left, [0.9, 0], [0, 0]), false);
  assert.equal(isAxisMappingTriggered(right, [0.9, 0], [0, 0]), true);
});

test("an axis mapping ignores axes the controller does not have", () => {
  const missing = encodeAxisMapping({ axis: 5, value: 1 });

  assert.equal(isAxisMappingTriggered(missing, [1, 1], [0, 0]), false);
  assert.equal(isAxisMappingTriggered(12, [1, 1], [0, 0]), false);
});
