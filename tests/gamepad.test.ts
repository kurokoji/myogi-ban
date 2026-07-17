import assert from "node:assert/strict";
import test from "node:test";
import {
  assignmentCodeFromInput,
  GamepadManager,
  toggleMappingAssignment,
  UNASSIGNED_MAPPING,
} from "../src/gamepad";

test("axis assignment completes from a single detected input", () => {
  assert.equal(
    assignmentCodeFromInput(null, { axis: 1, value: -0.8 }),
    GamepadManager.axisToCode(1, -0.8),
  );
});

test("button assignment takes priority over an axis input", () => {
  assert.equal(assignmentCodeFromInput(4, { axis: 1, value: -0.8 }), 4);
});

test("GamepadManager dispose removes its gamepad event listeners", () => {
  const listeners = new Map<string, Set<EventListener>>();
  const fakeWindow = {
    addEventListener(type: string, listener: EventListener) {
      const entries = listeners.get(type) ?? new Set<EventListener>();
      entries.add(listener);
      listeners.set(type, entries);
    },
    removeEventListener(type: string, listener: EventListener) {
      listeners.get(type)?.delete(listener);
    },
  };
  Object.assign(globalThis, { window: fakeWindow });
  const manager = new GamepadManager();
  assert.equal(listeners.get("gamepadconnected")?.size, 1);
  manager.dispose();
  assert.equal(listeners.get("gamepadconnected")?.size, 0);
  assert.equal(listeners.get("gamepaddisconnected")?.size, 0);
});

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
