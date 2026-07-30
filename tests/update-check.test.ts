import assert from "node:assert/strict";
import test from "node:test";
import {
  isNewerVersion,
  parseLatestRelease,
  resolveInstallerAssetName,
  resolveObsPluginAssetName,
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

test("resolveInstallerAssetName matches the asset name GitHub stores after upload", () => {
  // electron-builder's local artifact is "Myogi Ban Setup <version>.exe", but
  // GitHub replaces spaces with periods in release asset filenames on
  // upload, so the name we must match against the API is the dotted form.
  assert.equal(
    resolveInstallerAssetName("1.0.18"),
    "Myogi.Ban.Setup.1.0.18.exe",
  );
});

test("resolveObsPluginAssetName matches the OBS plugin installer's artifact name", () => {
  // Unlike the app installer, this filename has no spaces to begin with, so
  // GitHub's space-to-period substitution never changes it.
  assert.equal(
    resolveObsPluginAssetName("1.0.18"),
    "Myogi-Ban-OBS-Plugin-Setup-1.0.18.exe",
  );
});

test("parseLatestRelease extracts the version, tag, and matching installer assets", () => {
  const result = parseLatestRelease({
    tag_name: "v1.0.18",
    assets: [
      {
        name: "Myogi.Ban.Setup.1.0.18.exe",
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
    assetName: "Myogi.Ban.Setup.1.0.18.exe",
    assetUrl: "https://example.com/app-installer.exe",
    obsPluginAssetName: "Myogi-Ban-OBS-Plugin-Setup-1.0.18.exe",
    obsPluginAssetUrl: "https://example.com/obs-installer.exe",
  });
});

test("parseLatestRelease still succeeds when the release has no OBS plugin asset", () => {
  const result = parseLatestRelease({
    tag_name: "v1.0.18",
    assets: [
      {
        name: "Myogi.Ban.Setup.1.0.18.exe",
        browser_download_url: "https://example.com/app-installer.exe",
      },
    ],
  });

  assert.deepEqual(result, {
    version: "1.0.18",
    tagName: "v1.0.18",
    assetName: "Myogi.Ban.Setup.1.0.18.exe",
    assetUrl: "https://example.com/app-installer.exe",
    obsPluginAssetName: null,
    obsPluginAssetUrl: null,
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
