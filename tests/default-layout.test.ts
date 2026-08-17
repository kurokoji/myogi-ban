import assert from "node:assert/strict";
import test from "node:test";
import { selectDefaultLayoutEntry } from "../src/default-layout";

const entries = [
  { id: "default", name: "default", builtin: true },
  { id: "custom", name: "My Layout", builtin: false },
];

test("selectDefaultLayoutEntry prefers requested and falls back to builtin default", () => {
  assert.deepEqual(selectDefaultLayoutEntry(entries, "custom"), entries[1]);
  assert.deepEqual(selectDefaultLayoutEntry(entries, "missing"), entries[0]);
});

test("selectDefaultLayoutEntry matches the id rather than the displayed name", () => {
  assert.deepEqual(selectDefaultLayoutEntry(entries, "My Layout"), entries[0]);
});

test("selectDefaultLayoutEntry prefers a user layout over a built-in with the same id", () => {
  const shadowed = [
    { id: "shared", name: "built-in", builtin: true },
    { id: "shared", name: "mine", builtin: false },
  ];

  assert.deepEqual(selectDefaultLayoutEntry(shadowed, "shared"), shadowed[1]);
});
