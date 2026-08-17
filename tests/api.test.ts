import assert from "node:assert/strict";
import test from "node:test";
import { ApiClient, ApiError } from "../src/api";

test("ApiClient returns parsed JSON for successful requests", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true, data: [{ name: "default", builtin: true }] }),
  );

  assert.deepEqual(await new ApiClient().getLayouts(), [
    { name: "default", builtin: true },
  ]);
  assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/layouts");
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
    Response.json({ ok: true, data: { version: "test" } }),
  );

  await new ApiClient().getLayout("player one");
  assert.equal(
    fetchMock.mock.calls[0].arguments[0],
    "/api/layouts/player%20one",
  );
});

test("ApiClient can explicitly request a built-in layout", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true, data: { version: "test" } }),
  );

  await new ApiClient().getLayout("hit-box-ultra", true);
  assert.match(
    String(fetchMock.mock.calls[0].arguments[0]),
    /hit-box-ultra\?builtin=true$/,
  );
});

test("ApiClient saves a layout by replacing its named resource", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true }),
  );
  const layout = { name: "player one" } as never;

  await new ApiClient().saveLayout("player one", layout, false);

  assert.equal(
    fetchMock.mock.calls[0].arguments[0],
    "/api/layouts/player%20one",
  );
  const init = fetchMock.mock.calls[0].arguments[1] as RequestInit;
  assert.equal(init.method, "PUT");
  assert.deepEqual(JSON.parse(String(init.body)), {
    data: layout,
    overwrite: false,
  });
});

test("ApiClient renames a layout", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true }),
  );

  await new ApiClient().renameLayout("player one", "player two");

  assert.equal(
    fetchMock.mock.calls[0].arguments[0],
    "/api/layouts/player%20one/rename",
  );
  const init = fetchMock.mock.calls[0].arguments[1] as RequestInit;
  assert.equal(init.method, "POST");
  assert.deepEqual(JSON.parse(String(init.body)), {
    newName: "player two",
  });
});

test("ApiClient replaces state and the default layout with PUT", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true }),
  );

  await new ApiClient().sendState({ connected: true } as never);
  await new ApiClient().setDefaultLayout("player one");

  assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/state");
  assert.equal(
    (fetchMock.mock.calls[0].arguments[1] as RequestInit).method,
    "PUT",
  );
  assert.equal(fetchMock.mock.calls[1].arguments[0], "/api/default-layout");
  assert.equal(
    (fetchMock.mock.calls[1].arguments[1] as RequestInit).method,
    "PUT",
  );
});

test("ApiClient uploads a binary layout package", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({
      ok: true,
      data: { name: "imported", layout: { name: "imported" } },
    }),
  );

  const result = await new ApiClient().importLayoutPackage(
    Uint8Array.from([1, 2, 3]),
  );

  assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/layout-imports");
  const init = fetchMock.mock.calls[0].arguments[1] as RequestInit;
  assert.equal(init.method, "POST");
  assert.equal(
    (init.headers as Record<string, string>)["Content-Type"],
    "application/octet-stream",
  );
  assert.equal(result.name, "imported");
});

test("ApiClient creates assets under their layout resource", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true, data: { fileName: "button.png" } }),
  );

  await new ApiClient().uploadImage({
    data: "data:image/png;base64,test",
    layoutId: "player one",
    fileName: "button.png",
  });

  assert.equal(
    fetchMock.mock.calls[0].arguments[0],
    "/api/layouts/player%20one/assets",
  );
  assert.deepEqual(
    JSON.parse(
      String((fetchMock.mock.calls[0].arguments[1] as RequestInit).body),
    ),
    { data: "data:image/png;base64,test", fileName: "button.png" },
  );
});

test("ApiClient exposes layout package validation codes", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: false, error: "unsafe_path" }, { status: 400 }),
  );

  await assert.rejects(
    () => new ApiClient().importLayoutPackage(new Uint8Array()),
    (error) => error instanceof ApiError && error.code === "unsafe_path",
  );
});

test("ApiClient fetches the update status", async (t) => {
  const status = {
    currentVersion: "1.0.17",
    latestVersion: "1.0.18",
    updateAvailable: true,
    installSupported: true,
    releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
    download: { state: "idle" },
  };
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true, data: status }),
  );

  assert.deepEqual(await new ApiClient().getUpdateStatus(), status);
  assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/update/status");
});

test("ApiClient forces a manual update check", async (t) => {
  const status = {
    currentVersion: "1.0.17",
    latestVersion: null,
    updateAvailable: false,
    installSupported: true,
    releaseUrl: null,
    download: { state: "idle" },
  };
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true, data: status }),
  );

  assert.deepEqual(await new ApiClient().checkForUpdate(), status);
  assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/update/check");
  assert.equal(
    (fetchMock.mock.calls[0].arguments[1] as RequestInit).method,
    "POST",
  );
});

test("ApiClient fetches the what's new status", async (t) => {
  const status = {
    show: true,
    version: "1.0.18",
    notes: "- new stuff",
    releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
  };
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true, data: status }),
  );

  assert.deepEqual(await new ApiClient().getWhatsNew(), status);
  assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/whats-new");
});

test("ApiClient fetches release notes for the current version on demand", async (t) => {
  const notes = {
    version: "1.0.18",
    notes: "- current notes",
    releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
  };
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true, data: notes }),
  );

  assert.deepEqual(await new ApiClient().getCurrentReleaseNotes(), notes);
  assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/whats-new/current");
});

test("ApiClient starts an update download", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true }),
  );

  await new ApiClient().startUpdateDownload();

  assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/update/download");
  assert.equal(
    (fetchMock.mock.calls[0].arguments[1] as RequestInit).method,
    "POST",
  );
});

test("ApiClient installs a downloaded update", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true }),
  );

  await new ApiClient().installUpdate();

  assert.equal(fetchMock.mock.calls[0].arguments[0], "/api/update/install");
  assert.equal(
    (fetchMock.mock.calls[0].arguments[1] as RequestInit).method,
    "POST",
  );
});

test("ApiClient starts an OBS plugin update download", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true }),
  );

  await new ApiClient().startObsPluginDownload();

  assert.equal(
    fetchMock.mock.calls[0].arguments[0],
    "/api/update/obs-plugin/download",
  );
  assert.equal(
    (fetchMock.mock.calls[0].arguments[1] as RequestInit).method,
    "POST",
  );
});

test("ApiClient installs a downloaded OBS plugin update", async (t) => {
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true }),
  );

  await new ApiClient().installObsPlugin();

  assert.equal(
    fetchMock.mock.calls[0].arguments[0],
    "/api/update/obs-plugin/install",
  );
  assert.equal(
    (fetchMock.mock.calls[0].arguments[1] as RequestInit).method,
    "POST",
  );
});
