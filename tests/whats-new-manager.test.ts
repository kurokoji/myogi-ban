import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { WhatsNewManager } from "../src/whats-new-manager";

function releaseNotesResponse(body: string) {
  return new Response(JSON.stringify({ body }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function withStateFile(t: import("node:test").TestContext) {
  const dir = mkdtempSync(join(tmpdir(), "myogi-ban-whats-new-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return join(dir, "last-seen-version.json");
}

test("shows nothing on the very first run, and records the current version", async (t) => {
  const stateFile = withStateFile(t);
  const manager = new WhatsNewManager({
    currentVersion: "1.0.18",
    stateFile,
    fetchImpl: async () => releaseNotesResponse("- new stuff"),
  });

  const status = await manager.getStatus();

  assert.equal(status.show, false);
  assert.equal(status.notes, null);
  assert.deepEqual(JSON.parse(readFileSync(stateFile, "utf8")), {
    lastSeenVersion: "1.0.18",
  });
});

test("shows nothing on a second run at the same version", async (t) => {
  const stateFile = withStateFile(t);
  const manager = new WhatsNewManager({
    currentVersion: "1.0.18",
    stateFile,
    fetchImpl: async () => releaseNotesResponse("- new stuff"),
  });
  await manager.getStatus();

  const status = await manager.getStatus();

  assert.equal(status.show, false);
});

test("shows the release notes after the recorded version changes", async (t) => {
  const stateFile = withStateFile(t);
  const first = new WhatsNewManager({
    currentVersion: "1.0.17",
    stateFile,
    fetchImpl: async () => releaseNotesResponse("- old"),
  });
  await first.getStatus();

  const second = new WhatsNewManager({
    currentVersion: "1.0.18",
    stateFile,
    fetchImpl: async () => releaseNotesResponse("- new stuff"),
  });
  const status = await second.getStatus();

  assert.equal(status.show, true);
  assert.equal(status.version, "1.0.18");
  assert.equal(status.notes, "- new stuff");
  assert.equal(
    status.releaseUrl,
    "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
  );
  assert.deepEqual(JSON.parse(readFileSync(stateFile, "utf8")), {
    lastSeenVersion: "1.0.18",
  });
});

test("getCurrentReleaseNotes returns notes for the running version on demand", async (t) => {
  const stateFile = withStateFile(t);
  const manager = new WhatsNewManager({
    currentVersion: "1.0.18",
    stateFile,
    fetchImpl: async () => releaseNotesResponse("- current notes"),
  });

  const notes = await manager.getCurrentReleaseNotes();

  assert.deepEqual(notes, {
    version: "1.0.18",
    notes: "- current notes",
    releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
  });
});

test("getCurrentReleaseNotes does not affect the auto-popup seen state", async (t) => {
  const stateFile = withStateFile(t);
  const manager = new WhatsNewManager({
    currentVersion: "1.0.18",
    stateFile,
    fetchImpl: async () => releaseNotesResponse("- current notes"),
  });

  await manager.getCurrentReleaseNotes();
  const status = await manager.getStatus();

  // First-ever getStatus() call still behaves like a first run: nothing to
  // show automatically, since getCurrentReleaseNotes() never recorded a
  // "last seen" version.
  assert.equal(status.show, false);
});

test("still shows the popup when the release notes fetch fails, without notes", async (t) => {
  const stateFile = withStateFile(t);
  const first = new WhatsNewManager({
    currentVersion: "1.0.17",
    stateFile,
    fetchImpl: async () => releaseNotesResponse("- old"),
  });
  await first.getStatus();

  const second = new WhatsNewManager({
    currentVersion: "1.0.18",
    stateFile,
    fetchImpl: async () => new Response("not found", { status: 404 }),
  });
  const status = await second.getStatus();

  assert.equal(status.show, true);
  assert.equal(status.notes, null);
});
