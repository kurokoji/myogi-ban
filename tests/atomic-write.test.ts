import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { writeJsonAtomically } from "../src/layout-repository";

test("writeJsonAtomically replaces JSON without leaving temporary files", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-atomic-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const target = join(root, "layout.json");
  writeJsonAtomically(target, { name: "first" });
  writeJsonAtomically(target, { name: "second" });
  assert.equal(JSON.parse(readFileSync(target, "utf8")).name, "second");
  assert.deepEqual(readdirSync(root), ["layout.json"]);
});
