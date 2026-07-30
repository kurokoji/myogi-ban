import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { UpdateManager } from "../src/update-manager";
import { startTestWebServer } from "./web-server-harness";

function releaseResponse(tagName: string) {
  const version = tagName.replace(/^v/, "");
  return new Response(
    JSON.stringify({
      tag_name: tagName,
      assets: [
        {
          name: `Myogi Ban Setup ${version}.exe`,
          browser_download_url: `https://example.com/${version}/installer.exe`,
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function fetchGithubAndInstaller(tagName: string, content = "fake exe") {
  return async (input: string | URL) => {
    const url = String(input);
    if (url.includes("api.github.com")) return releaseResponse(tagName);
    return new Response(content, {
      status: 200,
      headers: { "content-length": String(content.length) },
    });
  };
}

test("GET /api/update/status reports the update manager's status", async () => {
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
  });
  const server = await startTestWebServer({}, undefined, manager);

  try {
    const status = await server.getJson("/api/update/status");
    assert.deepEqual(status, {
      currentVersion: "1.0.17",
      latestVersion: "1.0.18",
      updateAvailable: true,
      installSupported: false,
      releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
      download: { state: "idle" },
    });
  } finally {
    await server.close();
  }
});

test("POST /api/update/check forces a fresh check and reports the result", async () => {
  let calls = 0;
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: async (input: string | URL) => {
      const url = String(input);
      if (url.includes("api.github.com")) {
        calls += 1;
        return releaseResponse("v1.0.18");
      }
      return new Response("exe", { status: 200 });
    },
    checkIntervalMs: 60 * 60 * 1000,
  });
  const server = await startTestWebServer({}, undefined, manager);

  try {
    await server.getJson("/api/update/status");
    await server.postJson("/api/update/check", {});
    const status = await server.getJson<{
      updateAvailable: boolean;
      latestVersion: string | null;
    }>("/api/update/status");

    assert.equal(calls, 2);
    assert.equal(status.updateAvailable, true);
    assert.equal(status.latestVersion, "1.0.18");
  } finally {
    await server.close();
  }
});

test("POST /api/update/download rejects when the environment does not support installing", async () => {
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
  });
  const server = await startTestWebServer({}, undefined, manager);

  try {
    const response = await fetch(`${server.baseUrl}/api/update/download`, {
      method: "POST",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "update_not_supported",
    });
  } finally {
    await server.close();
  }
});

test("POST /api/update/download rejects when there is no update available", async () => {
  const downloadDirectory = mkdtempSync(
    join(tmpdir(), "myogi-ban-update-routes-"),
  );
  const manager = new UpdateManager({
    currentVersion: "1.0.18",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
    install: { downloadDirectory, launchInstaller: () => {} },
  });
  const server = await startTestWebServer({}, undefined, manager);

  try {
    const response = await fetch(`${server.baseUrl}/api/update/download`, {
      method: "POST",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "no_update_available",
    });
  } finally {
    await server.close();
    rmSync(downloadDirectory, { recursive: true, force: true });
  }
});

test("POST /api/update/download starts the download, visible via status polling", async () => {
  const downloadDirectory = mkdtempSync(
    join(tmpdir(), "myogi-ban-update-routes-"),
  );
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
    install: { downloadDirectory, launchInstaller: () => {} },
  });
  const server = await startTestWebServer({}, undefined, manager);

  try {
    await server.postJson("/api/update/download", {});

    let status = await server.getJson<{ download: { state: string } }>(
      "/api/update/status",
    );
    for (let i = 0; i < 50 && status.download.state === "idle"; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      status = await server.getJson("/api/update/status");
    }
    assert.notEqual(status.download.state, "idle");
  } finally {
    await server.close();
    rmSync(downloadDirectory, { recursive: true, force: true });
  }
});

test("POST /api/update/install rejects when the installer is not downloaded yet", async () => {
  const downloadDirectory = mkdtempSync(
    join(tmpdir(), "myogi-ban-update-routes-"),
  );
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
    install: { downloadDirectory, launchInstaller: () => {} },
  });
  const server = await startTestWebServer({}, undefined, manager);

  try {
    const response = await fetch(`${server.baseUrl}/api/update/install`, {
      method: "POST",
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      ok: false,
      error: "installer_not_ready",
    });
  } finally {
    await server.close();
    rmSync(downloadDirectory, { recursive: true, force: true });
  }
});

test("POST /api/update/install launches the downloaded installer", async () => {
  const downloadDirectory = mkdtempSync(
    join(tmpdir(), "myogi-ban-update-routes-"),
  );
  let launched: string | undefined;
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
    install: {
      downloadDirectory,
      launchInstaller: (installerPath) => {
        launched = installerPath;
      },
    },
  });
  const server = await startTestWebServer({}, undefined, manager);

  try {
    await server.postJson("/api/update/download", {});

    let status = await server.getJson<{ download: { state: string } }>(
      "/api/update/status",
    );
    for (let i = 0; i < 50 && status.download.state !== "downloaded"; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      status = await server.getJson("/api/update/status");
    }
    assert.equal(status.download.state, "downloaded");

    await server.postJson("/api/update/install", {});

    assert.equal(
      launched,
      join(downloadDirectory, "Myogi Ban Setup 1.0.18.exe"),
    );
  } finally {
    await server.close();
    rmSync(downloadDirectory, { recursive: true, force: true });
  }
});
