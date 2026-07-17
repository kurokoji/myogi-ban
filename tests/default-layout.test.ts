import assert from "node:assert/strict";
import test from "node:test";
import { selectDefaultLayoutEntry } from "../src/default-layout";

const entries = [
  { name: "default", builtin: true },
  { name: "custom", builtin: false },
];

test("selectDefaultLayoutEntry prefers requested and falls back to builtin default", () => {
  assert.deepEqual(selectDefaultLayoutEntry(entries, "custom"), entries[1]);
  assert.deepEqual(selectDefaultLayoutEntry(entries, "missing"), entries[0]);
});
