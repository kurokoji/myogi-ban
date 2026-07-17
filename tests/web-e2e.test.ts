import assert from "node:assert/strict";
import test from "node:test";
import WebSocket from "ws";
import { createDefaultLayout } from "../src/layout";
import { startTestWebServer } from "./web-server-harness";

test("web layout flow reaches the viewer websocket", async () => {
  const source = createDefaultLayout();
  const app = await startTestWebServer({ default: source });

  try {
    assert.match(await app.getText("/view"), /<title>Viewer<\/title>/);
    const list =
      await app.getJson<{ name: string; builtin: boolean }[]>("/api/layouts");
    assert.deepEqual(list, [{ name: "default", builtin: true }]);

    const loaded = await app.getJson<typeof source>(
      "/api/layout/default?builtin=true",
    );
    const edited = {
      ...loaded,
      name: "e2e-edited",
      background: { ...loaded.background, cssColor: "#123456" },
    };
    await app.postJson("/api/layout/save", {
      name: edited.name,
      data: edited,
      overwrite: false,
    });
    const saved = await app.getJson<typeof source>("/api/layout/e2e-edited");
    assert.equal(saved.background.cssColor, "#123456");

    const viewerState = new Promise<{ layout: typeof source }>(
      (resolve, reject) => {
        const viewer = new WebSocket(app.webSocketUrl);
        viewer.once("error", reject);
        viewer.once("open", () => {
          void app.postJson("/api/state", {
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
