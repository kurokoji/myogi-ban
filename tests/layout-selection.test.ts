import assert from "node:assert/strict";
import test from "node:test";
import { selectLayoutAfterDelete } from "../src/layout-selection";

test("selectLayoutAfterDelete prefers a built-in layout with the deleted id", () => {
  const fallback = selectLayoutAfterDelete(
    [
      { id: "default", name: "default", builtin: true },
      { id: "custom", name: "HIT BOX ULTRA", builtin: true },
    ],
    "custom",
  );

  assert.deepEqual(fallback, {
    id: "custom",
    name: "HIT BOX ULTRA",
    builtin: true,
  });
});

test("selectLayoutAfterDelete ignores a built-in whose name matches the deleted id", () => {
  const fallback = selectLayoutAfterDelete(
    [
      { id: "default", name: "default", builtin: true },
      { id: "hit-box-ultra", name: "custom", builtin: true },
    ],
    "custom",
  );

  assert.deepEqual(fallback, {
    id: "default",
    name: "default",
    builtin: true,
  });
});

test("selectLayoutAfterDelete falls back to the first available layout", () => {
  const fallback = selectLayoutAfterDelete(
    [
      { id: "default", name: "default", builtin: true },
      { id: "other", name: "other", builtin: false },
    ],
    "custom",
  );

  assert.deepEqual(fallback, {
    id: "default",
    name: "default",
    builtin: true,
  });
});

test("selectLayoutAfterDelete returns undefined for an empty list", () => {
  assert.equal(selectLayoutAfterDelete([], "custom"), undefined);
});
