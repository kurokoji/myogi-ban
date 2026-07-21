import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveAvailableAssetName,
  validateImageUpload,
} from "../src/image-asset";

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

test("validateImageUpload accepts supported images and rejects unsafe input", () => {
  assert.doesNotThrow(() =>
    validateImageUpload({
      data: "data:image/png;base64,iVBORw0KGgo=",
      fileName: "button.png",
    }),
  );
  assert.throws(
    () =>
      validateImageUpload({
        data: "data:text/html;base64,AA==",
        fileName: "button.png",
      }),
    /Invalid image upload/,
  );
  assert.throws(
    () =>
      validateImageUpload({
        data: "data:image/png;base64,AA==",
        fileName: "../button.png",
      }),
    /Invalid image upload/,
  );
});

test("validateImageUpload rejects content that does not match its image type", () => {
  assert.throws(
    () =>
      validateImageUpload({
        data: "data:image/png;base64,R0lGODlh",
        fileName: "button.png",
      }),
    /invalid_image_content/,
  );
});
