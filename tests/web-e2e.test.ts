import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { createDefaultLayout } from "../src/layout";
import { createLayoutPackage } from "../src/layout-package";
import { startTestWebServer } from "./web-server-harness";

test("web server forwards a window display request to Electron", async () => {
  let requests = 0;
  const app = await startTestWebServer({}, () => {
    requests += 1;
  });

  try {
    await app.postJson("/api/window/show", {});
    assert.equal(requests, 1);
  } finally {
    await app.close();
  }
});

test("web server reports the current default layout dimensions", async () => {
  const layout = createDefaultLayout();
  layout.background.w = "375";
  layout.background.h = "234";
  const app = await startTestWebServer({ default: layout });

  try {
    assert.deepEqual(await app.getJson("/api/default-layout/dimensions"), {
      width: 375,
      height: 234,
    });
  } finally {
    await app.close();
  }
});

test("web server reports dimensions for a selected built-in layout", async () => {
  const layout = createDefaultLayout();
  layout.background.w = "640";
  layout.background.h = "360";
  const app = await startTestWebServer({ arcade: layout });

  try {
    assert.deepEqual(
      await app.getJson("/api/layouts/arcade/dimensions?builtin=true"),
      { width: 640, height: 360 },
    );
  } finally {
    await app.close();
  }
});

test("web layout flow reaches the viewer websocket", async () => {
  const source = createDefaultLayout();
  const app = await startTestWebServer({ default: source });

  try {
    assert.match(await app.getText("/view"), /<title>Viewer<\/title>/);
    const list =
      await app.getJson<{ name: string; builtin: boolean }[]>("/api/layouts");
    assert.deepEqual(list, [{ name: "default", builtin: true }]);

    const loaded = await app.getJson<typeof source>(
      "/api/layouts/default?builtin=true",
    );
    const edited = {
      ...loaded,
      name: "e2e-edited",
      background: { ...loaded.background, cssColor: "#123456" },
    };
    await app.putJson("/api/layouts/e2e-edited", {
      data: edited,
      overwrite: false,
    });
    const saved = await app.getJson<typeof source>("/api/layouts/e2e-edited");
    assert.equal(saved.background.cssColor, "#123456");

    const viewerState = new Promise<{ layout: typeof source }>(
      (resolve, reject) => {
        const viewer = new WebSocket(app.webSocketUrl);
        viewer.once("error", reject);
        viewer.once("open", () => {
          void app.putJson("/api/state", {
            connected: true,
            stick: "",
            buttons: [],
            layout: saved,
          });
        });
        viewer.once("message", (message) => {
          const event = JSON.parse(message.toString());
          viewer.close();
          resolve(event.data);
        });
      },
    );

    assert.equal((await viewerState).layout.background.cssColor, "#123456");
  } finally {
    await app.close();
  }
});

test("websocket rejects paths reserved for Vite HMR", async () => {
  const app = await startTestWebServer({ default: createDefaultLayout() });
  const rootUrl = app.webSocketUrl.replace(/\/ws$/, "/");

  try {
    const result = await new Promise<"open" | "rejected">((resolve) => {
      const socket = new WebSocket(rootUrl);
      socket.once("open", () => {
        socket.close();
        resolve("open");
      });
      socket.once("unexpected-response", () => resolve("rejected"));
    });
    assert.equal(result, "rejected");
  } finally {
    await app.close();
  }
});

test("web server atomically imports a binary layout package", async () => {
  const app = await startTestWebServer({ default: createDefaultLayout() });
  const layout = createDefaultLayout();
  layout.name = "package-import";
  layout.background.image = "background.png";

  try {
    const archive = await createLayoutPackage(layout, async () =>
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
    const imported = await app.postBinary<{
      name: string;
      layout: typeof layout;
    }>("/api/layout-imports", archive);

    assert.equal(imported.name, "package-import");
    assert.equal(imported.layout.background.image, "background.png");
    assert.equal(
      (await app.getJson<typeof layout>("/api/layouts/package-import")).name,
      "package-import",
    );
  } finally {
    await app.close();
  }
});
