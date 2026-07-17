import assert from "node:assert/strict";
import test from "node:test";
import { selectLayoutAfterDelete } from "../src/layout-selection";

test("selectLayoutAfterDelete prefers a built-in layout with the deleted name", () => {
  const fallback = selectLayoutAfterDelete(
    [
      { name: "default", builtin: true },
      { name: "custom", builtin: true },
    ],
    "custom",
  );

  assert.deepEqual(fallback, { name: "custom", builtin: true });
});

test("selectLayoutAfterDelete falls back to the first available layout", () => {
  const fallback = selectLayoutAfterDelete(
    [
      { name: "default", builtin: true },
      { name: "other", builtin: false },
    ],
    "custom",
  );

  assert.deepEqual(fallback, { name: "default", builtin: true });
});

test("selectLayoutAfterDelete returns undefined for an empty list", () => {
  assert.equal(selectLayoutAfterDelete([], "custom"), undefined);
});
