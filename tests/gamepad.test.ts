import assert from "node:assert/strict";
import test from "node:test";
import { toggleMappingAssignment, UNASSIGNED_MAPPING } from "../src/gamepad";

test("toggleMappingAssignment removes an input assigned to the same target", () => {
  const result = toggleMappingAssignment(
    [10, 20, 30],
    [40, 50, 60, 70],
    { type: "button", index: 1 },
    20,
  );

  assert.deepEqual(result.buttonMappings, [10, UNASSIGNED_MAPPING, 30]);
  assert.deepEqual(result.stickMappings, [40, 50, 60, 70]);
});

test("toggleMappingAssignment keeps an existing input when assigning a button", () => {
  const result = toggleMappingAssignment(
    [10, 20, 30],
    [40, 50, 60, 70],
    { type: "button", index: 2 },
    50,
  );

  assert.deepEqual(result.buttonMappings, [10, 20, 50]);
  assert.deepEqual(result.stickMappings, [40, 50, 60, 70]);
});

test("toggleMappingAssignment keeps an existing input when assigning a stick direction", () => {
  const result = toggleMappingAssignment(
    [10, 20, 30],
    [40, 50, 60, 70],
    { type: "stick", index: 0 },
    20,
  );

  assert.deepEqual(result.buttonMappings, [10, 20, 30]);
  assert.deepEqual(result.stickMappings, [20, 50, 60, 70]);
});
