import assert from "node:assert/strict";
import test from "node:test";
import {
  getInstalledObsPluginVersion,
  parseDisplayVersion,
} from "../src/obs-plugin-install-status";

const SAMPLE_REG_QUERY_OUTPUT = `
HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MyogiBanObsPlugin
    DisplayVersion    REG_SZ    1.0.23

`;

test("parseDisplayVersion extracts the version from reg query output", () => {
  assert.equal(parseDisplayVersion(SAMPLE_REG_QUERY_OUTPUT), "1.0.23");
});

test("parseDisplayVersion returns null when the output has no DisplayVersion line", () => {
  assert.equal(parseDisplayVersion("some unrelated output"), null);
});

test("getInstalledObsPluginVersion returns the parsed version on success", async () => {
  const version = await getInstalledObsPluginVersion(async () => ({
    stdout: SAMPLE_REG_QUERY_OUTPUT,
  }));

  assert.equal(version, "1.0.23");
});

test("getInstalledObsPluginVersion returns null when the registry key is not found", async () => {
  const version = await getInstalledObsPluginVersion(async () => {
    throw new Error(
      "ERROR: The system was unable to find the specified registry key or value.",
    );
  });

  assert.equal(version, null);
});

test("getInstalledObsPluginVersion queries a fixed, hardcoded key with no dynamic input", async () => {
  let calledFile: string | undefined;
  let calledArgs: string[] | undefined;

  await getInstalledObsPluginVersion(async (file, args) => {
    calledFile = file;
    calledArgs = args;
    return { stdout: SAMPLE_REG_QUERY_OUTPUT };
  });

  assert.match(calledFile as string, /reg\.exe$/i);
  assert.deepEqual(calledArgs, [
    "query",
    "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MyogiBanObsPlugin",
    "/v",
    "DisplayVersion",
    "/reg:64",
  ]);
});
