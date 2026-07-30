import assert from "node:assert/strict";
import test from "node:test";
import { IMAGE_ROUTE_PATHS } from "../src/server-routes/image-routes";
import { LAYOUT_ROUTE_PATHS } from "../src/server-routes/layout-routes";
import { STATE_ROUTE_PATHS } from "../src/server-routes/state-routes";
import { UPDATE_ROUTE_PATHS } from "../src/server-routes/update-routes";
import { WHATS_NEW_ROUTE_PATHS } from "../src/server-routes/whats-new-routes";
import { WINDOW_ROUTE_PATHS } from "../src/server-routes/window-routes";

test("server route modules own their public paths", () => {
  assert.deepEqual(STATE_ROUTE_PATHS, ["/api/state"]);
  assert.deepEqual(LAYOUT_ROUTE_PATHS, [
    "/api/layouts",
    "/api/layouts/:name",
    "/api/layouts/:name/rename",
    "/api/layouts/:name/dimensions",
    "/api/layout-imports",
    "/api/default-layout",
    "/api/default-layout/dimensions",
  ]);
  assert.deepEqual(IMAGE_ROUTE_PATHS, ["/api/layouts/:name/assets"]);
  assert.deepEqual(WINDOW_ROUTE_PATHS, ["/api/window/show"]);
  assert.deepEqual(UPDATE_ROUTE_PATHS, [
    "/api/update/status",
    "/api/update/check",
    "/api/update/download",
    "/api/update/install",
    "/api/update/obs-plugin/download",
    "/api/update/obs-plugin/install",
  ]);
  assert.deepEqual(WHATS_NEW_ROUTE_PATHS, [
    "/api/whats-new",
    "/api/whats-new/current",
  ]);
});
