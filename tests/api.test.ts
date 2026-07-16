import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient } from "../src/api";

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
    /API request failed: GET \/api\/layouts \(500\)/,
  );
});

test("ApiClient URL-encodes layout names", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ version: "test" }),
  );

  await new ApiClient().getLayout("player one");
  assert.match(String(fetchMock.mock.calls[0].arguments[0]), /player%20one$/);
});
