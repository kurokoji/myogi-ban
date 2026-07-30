import assert from "node:assert/strict";
import test from "node:test";
import {
  isNewerVersion,
  parseLatestRelease,
  resolveInstallerAssetName,
} from "../src/update-check";

test("isNewerVersion reports a higher patch version as newer", () => {
  assert.equal(isNewerVersion("1.0.17", "1.0.18"), true);
});

test("isNewerVersion reports an equal version as not newer", () => {
  assert.equal(isNewerVersion("1.0.17", "1.0.17"), false);
});

test("isNewerVersion compares version segments numerically, not as strings", () => {
  assert.equal(isNewerVersion("1.0.9", "1.0.10"), true);
});

test("isNewerVersion reports a higher minor version as newer even with a lower patch", () => {
  assert.equal(isNewerVersion("1.0.99", "1.1.0"), true);
});

test("isNewerVersion reports an older version as not newer", () => {
  assert.equal(isNewerVersion("1.0.18", "1.0.17"), false);
});

test("resolveInstallerAssetName matches electron-builder's default NSIS artifact name", () => {
  assert.equal(
    resolveInstallerAssetName("1.0.18"),
    "Myogi Ban Setup 1.0.18.exe",
  );
});

test("parseLatestRelease extracts the version, tag, and matching installer asset", () => {
  const result = parseLatestRelease({
    tag_name: "v1.0.18",
    assets: [
      {
        name: "Myogi Ban Setup 1.0.18.exe",
        browser_download_url: "https://example.com/app-installer.exe",
      },
      {
        name: "Myogi-Ban-OBS-Plugin-Setup-1.0.18.exe",
        browser_download_url: "https://example.com/obs-installer.exe",
      },
    ],
  });

  assert.deepEqual(result, {
    version: "1.0.18",
    tagName: "v1.0.18",
    assetName: "Myogi Ban Setup 1.0.18.exe",
    assetUrl: "https://example.com/app-installer.exe",
  });
});

test("parseLatestRelease returns null when tag_name is missing", () => {
  assert.equal(parseLatestRelease({ assets: [] }), null);
});

test("parseLatestRelease returns null when assets is not an array", () => {
  assert.equal(parseLatestRelease({ tag_name: "v1.0.18" }), null);
});

test("parseLatestRelease returns null when no asset matches the expected installer name", () => {
  const result = parseLatestRelease({
    tag_name: "v1.0.18",
    assets: [
      {
        name: "Myogi-Ban-OBS-Plugin-Setup-1.0.18.exe",
        browser_download_url: "https://example.com/obs-installer.exe",
      },
    ],
  });

  assert.equal(result, null);
});

test("parseLatestRelease returns null for a non-object payload", () => {
  assert.equal(parseLatestRelease(null), null);
  assert.equal(parseLatestRelease("v1.0.18"), null);
});
