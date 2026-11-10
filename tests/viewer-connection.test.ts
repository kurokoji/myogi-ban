import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultLayout } from "../src/layout";
import {
  createViewerWebSocketUrl,
  layoutForViewerState,
  nextViewerConnectionStatus,
  viewerInputModeFromSearch,
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

test("a native viewer asks the server for controller input on its websocket", () => {
  assert.equal(
    createViewerWebSocketUrl(
      { protocol: "http:", host: "127.0.0.1:33770" },
      "native",
    ),
    "ws://127.0.0.1:33770/ws?input=native",
  );
  assert.equal(
    createViewerWebSocketUrl(
      { protocol: "http:", host: "127.0.0.1:33770" },
      "browser",
    ),
    "ws://127.0.0.1:33770/ws",
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

test("viewer input mode defaults to the browser gamepad API", () => {
  assert.equal(viewerInputModeFromSearch(""), "browser");
  assert.equal(viewerInputModeFromSearch("?layout=a"), "browser");
  assert.equal(viewerInputModeFromSearch("?input=unknown"), "browser");
});

test("viewer input mode reads the native input request from the URL", () => {
  assert.equal(viewerInputModeFromSearch("?input=native"), "native");
  assert.equal(
    viewerInputModeFromSearch("?layout=a&builtin=true&input=native"),
    "native",
  );
});
