import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { WhatsNewManager } from "../src/whats-new-manager";
import { startTestWebServer } from "./web-server-harness";

function releaseNotesResponse(body: string) {
  return new Response(JSON.stringify({ body }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("GET /api/whats-new reports the manager's status", async () => {
  const stateDir = mkdtempSync(join(tmpdir(), "myogi-ban-whats-new-routes-"));
  const manager = new WhatsNewManager({
    currentVersion: "1.0.18",
    stateFile: join(stateDir, "last-seen-version.json"),
    fetchImpl: async () => releaseNotesResponse("- new stuff"),
  });
  const server = await startTestWebServer({}, undefined, undefined, manager);

  try {
    const status = await server.getJson("/api/whats-new");
    assert.deepEqual(status, {
      show: false,
      version: "1.0.18",
      notes: null,
      releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
    });
  } finally {
    await server.close();
    rmSync(stateDir, { recursive: true, force: true });
  }
});

test("GET /api/whats-new/current returns notes for the running version on demand", async () => {
  const stateDir = mkdtempSync(join(tmpdir(), "myogi-ban-whats-new-routes-"));
  const manager = new WhatsNewManager({
    currentVersion: "1.0.18",
    stateFile: join(stateDir, "last-seen-version.json"),
    fetchImpl: async () => releaseNotesResponse("- current notes"),
  });
  const server = await startTestWebServer({}, undefined, undefined, manager);

  try {
    const notes = await server.getJson("/api/whats-new/current");
    assert.deepEqual(notes, {
      version: "1.0.18",
      notes: "- current notes",
      releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
    });
  } finally {
    await server.close();
    rmSync(stateDir, { recursive: true, force: true });
  }
});
