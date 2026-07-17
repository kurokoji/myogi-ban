import assert from "node:assert/strict";
import test from "node:test";
import { IMAGE_ROUTE_PATHS } from "../src/server-routes/image-routes";
import { LAYOUT_ROUTE_PATHS } from "../src/server-routes/layout-routes";
import { STATE_ROUTE_PATHS } from "../src/server-routes/state-routes";

test("server route modules own their public paths", () => {
  assert.deepEqual(STATE_ROUTE_PATHS, ["/api/state"]);
  assert.ok(LAYOUT_ROUTE_PATHS.includes("/api/layout/:name"));
  assert.deepEqual(IMAGE_ROUTE_PATHS, ["/api/upload-image"]);
});
