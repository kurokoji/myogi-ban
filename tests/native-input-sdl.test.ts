import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";
import type { InputFrame } from "../src/native-input";
import {
  createSdlInputSource,
  loadSdlInputSource,
} from "../src/native-input-sdl";

class FakeController extends EventEmitter {
  buttons: Record<string, boolean> = {};
  axes: Record<string, number> = {};
  closed = false;
  close() {
    this.closed = true;
    this.emit("close");
  }
}

function createFakeSdl(deviceIds: number[]) {
  const module = new EventEmitter();
  const devices = deviceIds.map((id) => ({ id, name: `pad ${id}` }));
  const opened: FakeController[] = [];
  const sdl = {
    controller: {
      devices,
      openDevice() {
        const controller = new FakeController();
        opened.push(controller);
        return controller;
      },
      on: module.on.bind(module),
      off: module.off.bind(module),
    },
  };
  return { sdl, opened, module, devices };
}

test("the first controller's changes are reported as input frames", () => {
  const { sdl, opened } = createFakeSdl([0]);
  const frames: (InputFrame | null)[] = [];
  createSdlInputSource(sdl).subscribe((frame) => frames.push(frame));

  opened[0].buttons = { a: true };
  opened[0].emit("buttonDown", { button: "a" });

  assert.equal(frames.length, 1);
  assert.equal(frames[0]?.buttons[0], true);
});

test("a disconnected controller is reported as no input", () => {
  const { sdl, opened } = createFakeSdl([0]);
  const frames: (InputFrame | null)[] = [];
  createSdlInputSource(sdl).subscribe((frame) => frames.push(frame));

  opened[0].emit("close");

  assert.deepEqual(frames, [null]);
});

test("a controller plugged in later is picked up", () => {
  const { sdl, opened, module, devices } = createFakeSdl([]);
  const frames: (InputFrame | null)[] = [];
  createSdlInputSource(sdl).subscribe((frame) => frames.push(frame));

  devices.push({ id: 3, name: "late pad" });
  module.emit("deviceAdd", { device: devices[0] });
  opened[0].buttons = { b: true };
  opened[0].emit("buttonDown", { button: "b" });

  assert.equal(frames.at(-1)?.buttons[1], true);
});

test("the next controller takes over after the active one is unplugged", () => {
  const { sdl, opened, module, devices } = createFakeSdl([0]);
  const frames: (InputFrame | null)[] = [];
  createSdlInputSource(sdl).subscribe((frame) => frames.push(frame));

  devices.length = 0;
  opened[0].emit("close");
  devices.push({ id: 5, name: "second pad" });
  module.emit("deviceAdd", { device: devices[0] });
  opened[1].buttons = { x: true };
  opened[1].emit("buttonDown", { button: "x" });

  assert.equal(frames.at(-1)?.buttons[2], true);
});

test("unsubscribing closes the controller and stops hot-plug handling", () => {
  const { sdl, opened, module } = createFakeSdl([0]);
  const unsubscribe = createSdlInputSource(sdl).subscribe(() => {});

  unsubscribe();

  assert.equal(opened[0].closed, true);
  assert.equal(module.listenerCount("deviceAdd"), 0);
});

test("SDL is not loaded until native input is first requested", () => {
  let loads = 0;
  const { sdl } = createFakeSdl([]);
  const source = loadSdlInputSource(
    () => {
      loads += 1;
      return sdl;
    },
    () => {},
  );

  assert.equal(loads, 0);
  source.subscribe(() => {});
  assert.equal(loads, 1);
});

test("SDL is loaded only once across subscriptions", () => {
  let loads = 0;
  const { sdl } = createFakeSdl([]);
  const source = loadSdlInputSource(
    () => {
      loads += 1;
      return sdl;
    },
    () => {},
  );

  source.subscribe(() => {})();
  source.subscribe(() => {});

  assert.equal(loads, 1);
});

test("native input is unavailable, not fatal, when SDL cannot be loaded", () => {
  const messages: string[] = [];
  const source = loadSdlInputSource(
    () => {
      throw new Error("sdl.node missing");
    },
    (message) => messages.push(message),
  );
  const frames: unknown[] = [];

  const unsubscribe = source.subscribe((frame) => frames.push(frame));
  unsubscribe();

  assert.deepEqual(frames, []);
  assert.match(messages[0], /sdl.node missing/);
});
