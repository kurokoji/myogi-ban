import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("OBS SDK setup pins and verifies the stable OBS 32.2.1 assets", async () => {
  const script = await readFile("scripts/setup-obs-sdk.ps1", "utf8");

  assert.match(script, /32\.2\.1/);
  assert.match(script, /OBS-Studio-32\.2\.1-Windows-x64\.zip/);
  assert.match(
    script,
    /db64a2934f8261f85b1410b84be011207a0afda5400d008289f1f1e211bcc7de/i,
  );
  assert.match(
    script,
    /6a2532b1094bc51bc2fdeb1068d5c19cfe04216191a5b35c8707625401a80bf4/i,
  );
  assert.match(script, /Get-FileHash/);
  assert.match(script, /--exclude=.*build-aux/);
  assert.match(script, /obs\.dll/);
  assert.match(script, /obs\.lib/);
  assert.match(script, /libobsConfig\.cmake/);
});
