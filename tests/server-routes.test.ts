import assert from "node:assert/strict";
import test from "node:test";
import { IMAGE_ROUTE_PATHS } from "../src/server-routes/image-routes";
import { LAYOUT_ROUTE_PATHS } from "../src/server-routes/layout-routes";
import { STATE_ROUTE_PATHS } from "../src/server-routes/state-routes";

test("server route modules own their public paths", () => {
  assert.deepEqual(STATE_ROUTE_PATHS, ["/api/state"]);
  assert.deepEqual(LAYOUT_ROUTE_PATHS, [
    "/api/layouts",
    "/api/layouts/:name",
    "/api/layout-imports",
    "/api/default-layout",
  ]);
  assert.deepEqual(IMAGE_ROUTE_PATHS, ["/api/layouts/:name/assets"]);
});
