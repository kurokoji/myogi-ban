import assert from "node:assert/strict";
import test from "node:test";
import { apiFailure, apiSuccess } from "../src/api-response";

test("API response helpers create one success and failure shape", () => {
  assert.deepEqual(apiSuccess({ name: "default" }), {
    ok: true,
    data: { name: "default" },
  });
  assert.deepEqual(apiFailure("invalid_layout"), {
    ok: false,
    error: "invalid_layout",
  });
});
