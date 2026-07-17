import assert from "node:assert/strict";
import test from "node:test";
import { resizeWithAspectRatio } from "../src/linked-size";

test("resizeWithAspectRatio updates height when width changes", () => {
  assert.deepEqual(
    resizeWithAspectRatio({
      width: "100",
      height: "50",
      nextValue: 200,
      changed: "width",
      linked: true,
    }),
    { width: "200", height: "100" },
  );
});

test("resizeWithAspectRatio updates width when height changes", () => {
  assert.deepEqual(
    resizeWithAspectRatio({
      width: "100",
      height: "50",
      nextValue: 75,
      changed: "height",
      linked: true,
    }),
    { width: "150", height: "75" },
  );
});

test("resizeWithAspectRatio changes only one dimension when unlinked", () => {
  assert.deepEqual(
    resizeWithAspectRatio({
      width: "100",
      height: "50",
      nextValue: 200,
      changed: "width",
      linked: false,
    }),
    { width: "200", height: "50" },
  );
});

test("resizeWithAspectRatio uses inherited dimensions for the ratio", () => {
  assert.deepEqual(
    resizeWithAspectRatio({
      width: "",
      height: "",
      fallbackWidth: "120",
      fallbackHeight: "80",
      nextValue: 60,
      changed: "width",
      linked: true,
    }),
    { width: "60", height: "40" },
  );
});

test("resizeWithAspectRatio preserves the other dimension when cleared", () => {
  assert.deepEqual(
    resizeWithAspectRatio({
      width: "100",
      height: "50",
      nextValue: "",
      changed: "width",
      linked: true,
    }),
    { width: "", height: "50" },
  );
});
