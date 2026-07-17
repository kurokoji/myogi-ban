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
