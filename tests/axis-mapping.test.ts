import assert from "node:assert/strict";
import test from "node:test";
import { decodeAxisMapping, encodeAxisMapping } from "../src/axis-mapping";

test("axis mapping encode and decode round trip", () => {
  const code = encodeAxisMapping({ axis: 2, value: -0.75 });
  assert.deepEqual(decodeAxisMapping(code), { axis: 2, value: -0.75 });
});

test("decodeAxisMapping rejects button mapping codes", () => {
  assert.equal(decodeAxisMapping(12), null);
});
