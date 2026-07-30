import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { UpdateManager } from "../src/update-manager";

function releaseResponse(
  tagName: string,
  currentAppExeName = "Myogi Ban Setup",
) {
  const version = tagName.replace(/^v/, "");
  return new Response(
    JSON.stringify({
      tag_name: tagName,
      assets: [
        {
          name: `${currentAppExeName} ${version}.exe`,
          browser_download_url: `https://example.com/${version}/installer.exe`,
        },
      ],
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}

function countingFetch(response: () => Response) {
  let calls = 0;
  const fetchImpl = async () => {
    calls += 1;
    return response();
  };
  return { fetchImpl, calls: () => calls };
}

test("getStatus reports an available update when GitHub has a newer release", async () => {
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: async () => releaseResponse("v1.0.18"),
  });

  const status = await manager.getStatus();

  assert.equal(status.currentVersion, "1.0.17");
  assert.equal(status.latestVersion, "1.0.18");
  assert.equal(status.updateAvailable, true);
  assert.equal(
    status.releaseUrl,
    "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
  );
});

test("getStatus reports no available update when already on the latest release", async () => {
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: async () => releaseResponse("v1.0.17"),
  });

  const status = await manager.getStatus();

  assert.equal(status.updateAvailable, false);
});

test("getStatus caches the GitHub check within the check interval", async () => {
  let now = 0;
  const { fetchImpl, calls } = countingFetch(() => releaseResponse("v1.0.18"));
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl,
    now: () => now,
    checkIntervalMs: 1000,
  });

  await manager.getStatus();
  now += 500;
  await manager.getStatus();

  assert.equal(calls(), 1);
});

test("getStatus re-checks GitHub after the check interval elapses", async () => {
  let now = 0;
  const { fetchImpl, calls } = countingFetch(() => releaseResponse("v1.0.18"));
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl,
    now: () => now,
    checkIntervalMs: 1000,
  });

  await manager.getStatus();
  now += 1500;
  await manager.getStatus();

  assert.equal(calls(), 2);
});

test("checkNow forces a fresh GitHub check even within the check interval", async () => {
  let now = 0;
  const { fetchImpl, calls } = countingFetch(() => releaseResponse("v1.0.18"));
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl,
    now: () => now,
    checkIntervalMs: 1000,
  });

  await manager.getStatus();
  now += 100;
  const status = await manager.checkNow();

  assert.equal(calls(), 2);
  assert.equal(status.updateAvailable, true);
  assert.equal(status.latestVersion, "1.0.18");
});

test("a subsequent getStatus call reuses the result from checkNow", async () => {
  let now = 0;
  const { fetchImpl, calls } = countingFetch(() => releaseResponse("v1.0.18"));
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl,
    now: () => now,
    checkIntervalMs: 1000,
  });

  await manager.checkNow();
  now += 100;
  await manager.getStatus();

  assert.equal(calls(), 1);
});

test("getStatus does not throw and reports no update when the GitHub request fails", async () => {
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: async () => {
      throw new Error("network down");
    },
  });

  const status = await manager.getStatus();

  assert.equal(status.updateAvailable, false);
  assert.equal(status.latestVersion, null);
});

test("getStatus does not throw and reports no update when GitHub responds with an error status", async () => {
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: async () => new Response("not found", { status: 404 }),
  });

  const status = await manager.getStatus();

  assert.equal(status.updateAvailable, false);
});

test("installSupported reflects whether install capabilities were provided", async () => {
  const withoutInstall = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: async () => releaseResponse("v1.0.18"),
  });
  const withInstall = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: async () => releaseResponse("v1.0.18"),
    install: {
      downloadDirectory: "/tmp/does-not-matter",
      launchInstaller: () => {},
    },
  });

  assert.equal((await withoutInstall.getStatus()).installSupported, false);
  assert.equal((await withInstall.getStatus()).installSupported, true);
});

test("getStatus reports idle download state before any download starts", async () => {
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: async () => releaseResponse("v1.0.18"),
  });

  const status = await manager.getStatus();

  assert.deepEqual(status.download, { state: "idle" });
});

function installerContent() {
  return "fake installer exe bytes";
}

function fetchGithubAndInstaller(tagName: string) {
  return async (input: string | URL) => {
    const url = String(input);
    if (url.includes("api.github.com")) return releaseResponse(tagName);
    return new Response(installerContent(), {
      status: 200,
      headers: { "content-length": String(installerContent().length) },
    });
  };
}

function withTempDir(t: import("node:test").TestContext) {
  const dir = mkdtempSync(join(tmpdir(), "myogi-ban-update-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

test("startDownload downloads the installer to the configured directory", async (t) => {
  const downloadDirectory = withTempDir(t);
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
    install: { downloadDirectory, launchInstaller: () => {} },
  });
  await manager.getStatus();

  await manager.startDownload();

  const status = await manager.getStatus();
  assert.equal(status.download.state, "downloaded");
  const installerPath =
    status.download.state === "downloaded" ? status.download.installerPath : "";
  assert.equal(
    installerPath,
    join(downloadDirectory, "Myogi Ban Setup 1.0.18.exe"),
  );
  assert.equal(readFileSync(installerPath, "utf8"), installerContent());
});

test("startDownload reports a downloading state while in progress", async (t) => {
  const downloadDirectory = withTempDir(t);
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
    install: { downloadDirectory, launchInstaller: () => {} },
  });
  await manager.getStatus();

  const downloadPromise = manager.startDownload();
  const midStatus = await manager.getStatus();
  assert.equal(midStatus.download.state, "downloading");

  await downloadPromise;
});

test("startDownload does nothing without install support", async () => {
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
  });
  await manager.getStatus();

  await manager.startDownload();

  assert.deepEqual((await manager.getStatus()).download, { state: "idle" });
});

test("startDownload does nothing when there is no update available", async (t) => {
  const downloadDirectory = withTempDir(t);
  const manager = new UpdateManager({
    currentVersion: "1.0.18",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
    install: { downloadDirectory, launchInstaller: () => {} },
  });
  await manager.getStatus();

  await manager.startDownload();

  assert.deepEqual((await manager.getStatus()).download, { state: "idle" });
});

test("startDownload records an error state when the download fails", async (t) => {
  const downloadDirectory = withTempDir(t);
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: async (input: string | URL) => {
      const url = String(input);
      if (url.includes("api.github.com")) return releaseResponse("v1.0.18");
      throw new Error("connection reset");
    },
    install: { downloadDirectory, launchInstaller: () => {} },
  });
  await manager.getStatus();

  await manager.startDownload();

  const status = await manager.getStatus();
  assert.equal(status.download.state, "error");
});

test("install launches the downloaded installer", async (t) => {
  const downloadDirectory = withTempDir(t);
  let launchedPath: string | undefined;
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
    install: {
      downloadDirectory,
      launchInstaller: (installerPath) => {
        launchedPath = installerPath;
      },
    },
  });
  await manager.getStatus();
  await manager.startDownload();

  manager.install();

  assert.equal(
    launchedPath,
    join(downloadDirectory, "Myogi Ban Setup 1.0.18.exe"),
  );
});

test("install throws when the installer has not finished downloading", async () => {
  const manager = new UpdateManager({
    currentVersion: "1.0.17",
    fetchImpl: fetchGithubAndInstaller("v1.0.18"),
    install: {
      downloadDirectory: "/tmp/does-not-matter",
      launchInstaller: () => {},
    },
  });
  await manager.getStatus();

  assert.throws(() => manager.install());
});
