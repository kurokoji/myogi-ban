import assert from "node:assert/strict";
import test from "node:test";
import { encodeAxisMapping } from "../src/axis-mapping";
import { GamepadManager, UNASSIGNED_MAPPING } from "../src/gamepad";
import {
  areGamepadStatesEqual,
  gamepadStateForBroadcast,
  snapshotFromInputFrame,
} from "../src/gamepad-state";
import { createDefaultLayout } from "../src/layout";

test("gamepad states with the same observable values are equal", () => {
  const layout = createDefaultLayout();

  assert.equal(
    areGamepadStatesEqual(
      { stick: "stick", buttons: [false, true], connected: true, layout },
      { stick: "stick", buttons: [false, true], connected: true, layout },
    ),
    true,
  );
});

test("gamepad state broadcasts only initially or after an observable change", () => {
  const layout = createDefaultLayout();
  const initial = {
    stick: "stick",
    buttons: [false],
    connected: true,
    layout,
  };

  assert.equal(gamepadStateForBroadcast(null, initial), initial);
  assert.equal(gamepadStateForBroadcast(initial, { ...initial }), null);

  const changed = { ...initial, buttons: [true] };
  assert.equal(gamepadStateForBroadcast(initial, changed), changed);
});

test("gamepad state changes when stick, connection, or layout changes", () => {
  const initial = {
    stick: "stick",
    buttons: [false],
    connected: true,
    layout: createDefaultLayout(),
  };

  assert.equal(
    areGamepadStatesEqual(initial, { ...initial, stick: "up" }),
    false,
  );
  assert.equal(
    areGamepadStatesEqual(initial, { ...initial, connected: false }),
    false,
  );
  assert.equal(
    areGamepadStatesEqual(initial, {
      ...initial,
      layout: createDefaultLayout(),
    }),
    false,
  );
});

test("an input frame is mapped to buttons and stick directions like a browser gamepad", () => {
  const layout = createDefaultLayout();
  const buttons = Array.from({ length: 17 }, () => false);
  buttons[0] = true; // standard button 0 is assigned to layout button 4
  buttons[15] = true; // d-pad right
  const snapshot = snapshotFromInputFrame(
    { buttons, axes: [0, 0, 0, 0] },
    layout,
    GamepadManager.createDefaultButtonMappings(),
    GamepadManager.createDefaultStickMappings(),
  );

  assert.equal(snapshot.pressedButtons[4], true);
  assert.equal(snapshot.pressedButtons[0], false);
  assert.equal(snapshot.stickClass, "stick stick-right");
  assert.equal(snapshot.statusChanged, true);
});

test("an input frame honours axis assignments", () => {
  const layout = createDefaultLayout();
  const stickMappings = [
    UNASSIGNED_MAPPING,
    UNASSIGNED_MAPPING,
    encodeAxisMapping({ axis: 0, value: -1 }),
    UNASSIGNED_MAPPING,
  ];
  const snapshot = snapshotFromInputFrame(
    { buttons: [], axes: [-0.95, 0, 0, 0] },
    layout,
    GamepadManager.createDefaultButtonMappings(),
    stickMappings,
  );

  assert.equal(snapshot.stickClass, "stick stick-left");
});
