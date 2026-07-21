import assert from "node:assert/strict";
import test from "node:test";
import {
  MAX_IMAGE_BYTES,
  resolveAvailableAssetName,
  validateImageBytes,
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

test("validateImageBytes accepts an image slightly larger than 10 MB", () => {
  const bytes = new Uint8Array(11 * 1024 * 1024);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  assert.doesNotThrow(() =>
    validateImageBytes({ bytes, fileName: "background.png" }),
  );
});

test("validateImageBytes rejects an image larger than 15 MB", () => {
  const bytes = new Uint8Array(MAX_IMAGE_BYTES + 1);
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  assert.throws(
    () => validateImageBytes({ bytes, fileName: "background.png" }),
    /image_too_large/,
  );
});
