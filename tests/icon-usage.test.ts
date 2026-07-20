import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("editor controls do not use platform-dependent text icons", () => {
  const sources = [
    readFileSync("src/editor.tsx", "utf8"),
    readFileSync("src/components/editor/LinkedSizeInputs.tsx", "utf8"),
  ].join("\n");

  assert.doesNotMatch(sources, /🔗|⧉|↶|↷/u);
  assert.match(
    readFileSync("THIRD_PARTY_LICENSES.md", "utf8"),
    /Tabler Icons[\s\S]*MIT License/,
  );
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.ok(packageJson.build.files.includes("THIRD_PARTY_LICENSES.md"));
});

test("web pages use the application icon as their favicon", () => {
  for (const page of ["index.html", "view.html"]) {
    assert.match(
      readFileSync(page, "utf8"),
      /<link rel="icon" type="image\/png" href="\/favicon\.png" \/>/,
    );
  }

  const favicon = readFileSync("public/favicon.png");
  assert.deepEqual(
    favicon.subarray(0, 8),
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  );
  assert.equal(favicon.readUInt32BE(16), 64);
  assert.equal(favicon.readUInt32BE(20), 64);
});
