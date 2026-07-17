import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient, ApiError } from "../src/api";

test("ApiClient returns parsed JSON for successful requests", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json([{ name: "default", builtin: true }]),
  );

  assert.deepEqual(await new ApiClient().getLayouts(), [
    { name: "default", builtin: true },
  ]);
});

test("ApiClient rejects unsuccessful HTTP responses", async (t) => {
  t.mock.method(
    globalThis,
    "fetch",
    async () => new Response(null, { status: 500 }),
  );

  await assert.rejects(
    () => new ApiClient().getLayouts(),
    (error) => {
      assert.equal(error instanceof ApiError, true);
      assert.equal((error as ApiError).status, 500);
      assert.equal((error as ApiError).method, "GET");
      assert.equal((error as ApiError).path, "/api/layouts");
      return true;
    },
  );
});

test("ApiClient URL-encodes layout names", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ version: "test" }),
  );

  await new ApiClient().getLayout("player one");
  assert.match(String(fetchMock.mock.calls[0].arguments[0]), /player%20one$/);
});

test("ApiClient can explicitly request a built-in layout", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ version: "test" }),
  );

  await new ApiClient().getLayout("hit-box-ultra", true);
  assert.match(
    String(fetchMock.mock.calls[0].arguments[0]),
    /hit-box-ultra\?builtin=true$/,
  );
});
