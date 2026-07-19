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

test("restartable process reports unexpected exits but not intentional stops", async () => {
  const exits: Array<[number | null, string | null]> = [];
  let child: EventEmitter & { kill: (signal?: string) => void };
  const controller = createRestartableProcess(
    () => {
      child = Object.assign(new EventEmitter(), {
        kill(signal = "SIGTERM") {
          child.emit("exit", null, signal);
        },
      });
      return child;
    },
    { onUnexpectedExit: (code, signal) => exits.push([code, signal]) },
  );
  const first = controller.start();
  first.emit("exit", 2, null);
  assert.deepEqual(exits, [[2, null]]);
  controller.start();
  await controller.stop();
  assert.deepEqual(exits, [[2, null]]);
});

test("restartable process serializes concurrent restart requests", async () => {
  let activeChildren = 0;
  let maximumActiveChildren = 0;
  const controller = createRestartableProcess(() => {
    activeChildren += 1;
    maximumActiveChildren = Math.max(maximumActiveChildren, activeChildren);
    const child = Object.assign(new EventEmitter(), {
      kill() {
        setTimeout(() => {
          activeChildren -= 1;
          child.emit("exit", 0);
        }, 0);
      },
    });
    return child;
  });

  controller.start();
  await Promise.all([controller.restart(), controller.restart()]);
  assert.equal(maximumActiveChildren, 1);
  await controller.stop();
});
