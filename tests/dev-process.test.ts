import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import { createRestartableProcess } from "../scripts/dev-process.mjs";

test("restartable process stops the old child before spawning a replacement", async () => {
  const children: Array<EventEmitter & { kill: () => void }> = [];
  const controller = createRestartableProcess(() => {
    const child = Object.assign(new EventEmitter(), {
      kill() {
        child.emit("exit", 0);
      },
    });
    children.push(child);
    return child;
  });
  controller.start();
  await controller.restart();
  assert.equal(children.length, 2);
});
