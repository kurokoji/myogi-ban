import assert from "node:assert/strict";
import test from "node:test";
import { inputFrameFromNativeGamepad } from "../src/native-input";

test("face buttons and the d-pad follow the standard gamepad layout", () => {
  const frame = inputFrameFromNativeGamepad({
    buttons: { a: true, dpadUp: true, dpadRight: true },
    axes: {},
  });

  assert.equal(frame.buttons.length, 17);
  assert.deepEqual(
    frame.buttons.flatMap((pressed, index) => (pressed ? [index] : [])),
    [0, 12, 15],
  );
});

test("analog triggers count as buttons only when pressed nearly all the way", () => {
  const frame = inputFrameFromNativeGamepad({
    buttons: {},
    axes: { leftTrigger: 0.9, rightTrigger: 0.6 },
  });

  assert.equal(frame.buttons[6], true);
  assert.equal(frame.buttons[7], false);
});

test("triggers that rest at half travel are not read as pressed", () => {
  // Some controllers report 0.5 for a released trigger and 1 when pressed.
  const frame = inputFrameFromNativeGamepad({
    buttons: {},
    axes: { leftTrigger: 0.5000076, rightTrigger: 0.5 },
  });

  assert.equal(frame.buttons[6], false);
  assert.equal(frame.buttons[7], false);
});

test("stick axes follow the standard gamepad order", () => {
  const frame = inputFrameFromNativeGamepad({
    buttons: {},
    axes: { leftStickX: -1, leftStickY: 0.5, rightStickX: 0.25 },
  });

  assert.deepEqual(frame.axes, [-1, 0.5, 0.25, 0]);
});
