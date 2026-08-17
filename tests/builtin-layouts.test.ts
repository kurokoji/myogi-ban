import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  CURRENT_LAYOUT_FORMAT_VERSION,
  deserializeLayoutDocument,
} from "../src/layout-document";

const BUILTIN_LAYOUT_DIR = join(process.cwd(), "public", "layout");

function builtinLayoutIds(): string[] {
  return readdirSync(BUILTIN_LAYOUT_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function readBuiltinDocument(id: string): Record<string, unknown> {
  return JSON.parse(
    readFileSync(join(BUILTIN_LAYOUT_DIR, id, "layout.json"), "utf8"),
  );
}

test("the shipped layouts exist", () => {
  assert.equal(builtinLayoutIds().includes("default"), true);
});

test("every shipped layout is written in the current format", () => {
  for (const id of builtinLayoutIds()) {
    assert.equal(
      readBuiltinDocument(id).formatVersion,
      CURRENT_LAYOUT_FORMAT_VERSION,
      `${id} is not in the current layout format`,
    );
  }
});

test("every shipped layout carries its directory name as its id", () => {
  for (const id of builtinLayoutIds()) {
    assert.equal(readBuiltinDocument(id).id, id);
  }
});

test("every shipped layout still deserializes", () => {
  for (const id of builtinLayoutIds()) {
    const layout = deserializeLayoutDocument(readBuiltinDocument(id));
    assert.equal(layout.id, id);
    assert.equal(layout.name.length > 0, true);
    assert.equal(layout.totalbuttonshow > 0, true);
  }
});
