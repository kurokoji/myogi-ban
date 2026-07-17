import assert from "node:assert/strict";
import test from "node:test";
import { startGamepadMonitor } from "../src/gamepad-monitor";

test("startGamepadMonitor polls, updates, and cancels both loops", () => {
  let intervalCallback = () => {};
  let frameCallback = () => {};
  const cancelled: number[] = [];
  let polls = 0;
  let updates = 0;
  const stop = startGamepadMonitor({
    poll: () => polls++,
    update: () => updates++,
    setInterval: (callback) => {
      intervalCallback = callback;
      return 1;
    },
    clearInterval: (id) => cancelled.push(id),
    requestFrame: (callback) => {
      frameCallback = callback;
      return 2;
    },
    cancelFrame: (id) => cancelled.push(id),
  });
  intervalCallback();
  frameCallback();
  stop();
  assert.equal(polls, 1);
  assert.equal(updates, 1);
  assert.deepEqual(cancelled, [1, 2]);
});
