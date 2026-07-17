import assert from "node:assert/strict";
import test from "node:test";
import { nextViewerConnectionStatus } from "../src/viewer-connection";

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
