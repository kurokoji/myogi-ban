import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { createDefaultLayout } from "../src/layout";
import type { InputFrame, NativeInputSource } from "../src/native-input";
import { startTestWebServer } from "./web-server-harness";

function createFakeSource() {
  const listeners = new Set<(frame: InputFrame | null) => void>();
  const source: NativeInputSource = {
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
  return {
    source,
    emit: (frame: InputFrame | null) => {
      for (const listener of listeners) listener(frame);
    },
    listenerCount: () => listeners.size,
  };
}

function nextMessage(socket: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error("no websocket message within 1s")),
      1000,
    );
    socket.once("error", reject);
    socket.once("message", (message) => {
      clearTimeout(timer);
      resolve(JSON.parse(message.toString()));
    });
  });
}

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.once("error", reject);
    socket.once("open", () => resolve(socket));
  });
}

function nativeUrl(app: { webSocketUrl: string }): string {
  return `${app.webSocketUrl}?input=native`;
}

const frame: InputFrame = { buttons: [true, false], axes: [0, -1] };

test("server pushes native input frames to connected viewers", async () => {
  const fake = createFakeSource();
  const app = await startTestWebServer(
    { default: createDefaultLayout() },
    undefined,
    undefined,
    undefined,
    fake.source,
  );
  const viewer = await openSocket(nativeUrl(app));

  try {
    const received = nextMessage(viewer);
    fake.emit(frame);

    assert.deepEqual(await received, { type: "input", data: frame });
  } finally {
    viewer.close();
    await app.close();
  }
});

test("a viewer connecting later receives the latest native input frame", async () => {
  const fake = createFakeSource();
  const app = await startTestWebServer(
    { default: createDefaultLayout() },
    undefined,
    undefined,
    undefined,
    fake.source,
  );
  const first = await openSocket(nativeUrl(app));
  fake.emit(frame);
  const late = new WebSocket(nativeUrl(app));
  const received = nextMessage(late);

  try {
    assert.deepEqual(await received, { type: "input", data: frame });
  } finally {
    first.close();
    late.close();
    await app.close();
  }
});

test("server stops listening to native input once it is closed", async () => {
  const fake = createFakeSource();
  const app = await startTestWebServer(
    { default: createDefaultLayout() },
    undefined,
    undefined,
    undefined,
    fake.source,
  );

  const viewer = await openSocket(nativeUrl(app));
  assert.equal(fake.listenerCount(), 1);
  viewer.close();
  await app.close();
  assert.equal(fake.listenerCount(), 0);
});

test("native input stays idle until a native viewer connects", async () => {
  const fake = createFakeSource();
  const app = await startTestWebServer(
    { default: createDefaultLayout() },
    undefined,
    undefined,
    undefined,
    fake.source,
  );
  const editor = await openSocket(app.webSocketUrl);

  try {
    assert.equal(fake.listenerCount(), 0);
  } finally {
    editor.close();
    await app.close();
  }
});

test("native input is released when the last native viewer leaves", async () => {
  const fake = createFakeSource();
  const app = await startTestWebServer(
    { default: createDefaultLayout() },
    undefined,
    undefined,
    undefined,
    fake.source,
  );
  const first = await openSocket(nativeUrl(app));
  const second = await openSocket(nativeUrl(app));

  try {
    assert.equal(fake.listenerCount(), 1);
    first.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(fake.listenerCount(), 1);
    second.close();
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.equal(fake.listenerCount(), 0);
  } finally {
    await app.close();
  }
});
