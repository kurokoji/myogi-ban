import assert from "node:assert/strict";
import test from "node:test";
import {
  createViewerWebSocketUrl,
  nextViewerConnectionStatus,
} from "../src/viewer-connection";

test("viewer websocket uses the dedicated application path", () => {
  assert.equal(
    createViewerWebSocketUrl({ protocol: "http:", host: "localhost:5173" }),
    "ws://localhost:5173/ws",
  );
  assert.equal(
    createViewerWebSocketUrl({ protocol: "https:", host: "example.com" }),
    "wss://example.com/ws",
  );
});

test("viewer connection status covers API errors and websocket reconnects", () => {
  assert.equal(nextViewerConnectionStatus("loading", "api-error"), "error");
  assert.equal(
    nextViewerConnectionStatus("loading", "socket-open"),
    "connected",
  );
  assert.equal(
    nextViewerConnectionStatus("connected", "socket-close"),
    "disconnected",
  );
  assert.equal(
    nextViewerConnectionStatus("disconnected", "socket-open"),
    "connected",
  );
});
