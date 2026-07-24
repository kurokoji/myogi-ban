import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("OBS SDK setup pins and verifies the stable OBS 32.1.2 assets", async () => {
  const script = await readFile("scripts/setup-obs-sdk.ps1", "utf8");

  assert.match(script, /32\.1\.2/);
  assert.match(script, /OBS-Studio-32\.1\.2-Windows-x64\.zip/);
  assert.match(
    script,
    /8d97e4563bd8d22d03e63042aa7dccede1d555c9bd35ce8a9e5019b0d0201bf6/i,
  );
  assert.match(script, /Get-FileHash/);
  assert.match(script, /--exclude=.*build-aux/);
  assert.match(script, /obs\.dll/);
  assert.match(script, /obs\.lib/);
  assert.match(script, /libobsConfig\.cmake/);
});
