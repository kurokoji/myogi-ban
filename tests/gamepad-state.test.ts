import assert from "node:assert/strict";
import test from "node:test";
import {
  areGamepadStatesEqual,
  gamepadStateForBroadcast,
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
