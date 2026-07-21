import assert from "node:assert/strict";
import test from "node:test";
import { runSingleFlight } from "../src/single-flight";

test("runSingleFlight ignores a second operation until the first settles", async () => {
  const lock = { current: false };
  let release: (() => void) | undefined;
  let calls = 0;
  const operation = () => {
    calls += 1;
    return new Promise<void>((resolve) => {
      release = resolve;
    });
  };

  const first = runSingleFlight(lock, operation);
  const second = runSingleFlight(lock, operation);
  assert.equal(calls, 1);
  assert.equal(await second, undefined);
  release?.();
  await first;
  await runSingleFlight(lock, async () => {
    calls += 1;
  });
  assert.equal(calls, 2);
});
