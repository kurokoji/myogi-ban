import assert from "node:assert/strict";
import test from "node:test";
import { resolveAvailableAssetName } from "../src/image-asset";

test("resolveAvailableAssetName preserves unused names and suffixes collisions", () => {
  assert.equal(
    resolveAvailableAssetName("button.png", new Set()),
    "button.png",
  );
  assert.equal(
    resolveAvailableAssetName("button.png", new Set(["button.png"])),
    "button-2.png",
  );
  assert.equal(
    resolveAvailableAssetName(
      "button.png",
      new Set(["button.png", "button-2.png"]),
    ),
    "button-3.png",
  );
});
