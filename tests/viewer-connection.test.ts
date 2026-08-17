import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultLayout } from "../src/layout";
import {
  createViewerWebSocketUrl,
  layoutForViewerState,
  nextViewerConnectionStatus,
  viewerLayoutRequestFromSearch,
} from "../src/viewer-connection";

test("viewer layout request parses an optional layout and built-in flag", () => {
  assert.deepEqual(
    viewerLayoutRequestFromSearch("?layout=arcade%20stick&builtin=true"),
    { id: "arcade stick", builtin: true },
  );
  assert.equal(viewerLayoutRequestFromSearch(""), null);
});

test("fixed viewer layouts ignore layouts delivered with input state", () => {
  const current = createDefaultLayout();
  current.name = "requested";
  const incoming = createDefaultLayout();
  incoming.name = "default";

  assert.equal(layoutForViewerState(current, incoming, true), current);
  assert.equal(layoutForViewerState(current, incoming, false), incoming);
});

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
