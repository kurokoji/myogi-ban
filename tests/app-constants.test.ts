import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_BACKGROUND_SIZE,
  GAMEPAD_POLL_INTERVAL_MS,
  MAX_VISIBLE_BUTTONS,
} from "../src/app-constants";

test("shared application limits and timing constants remain explicit", () => {
  assert.equal(MAX_VISIBLE_BUTTONS, 48);
  assert.deepEqual(DEFAULT_BACKGROUND_SIZE, { width: 500, height: 250 });
  assert.equal(GAMEPAD_POLL_INTERVAL_MS, 100);
});
