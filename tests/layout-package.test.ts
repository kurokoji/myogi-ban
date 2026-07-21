import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { createDefaultLayout } from "../src/layout";
import { serializeLayoutDocument } from "../src/layout-document";
import {
  createLayoutPackage,
  InvalidLayoutPackageError,
  MAX_LAYOUT_PACKAGE_BYTES,
  readLayoutPackage,
} from "../src/layout-package";

const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

test("readLayoutPackage rejects an oversized archive before extraction", async () => {
  const oversized = {
    byteLength: MAX_LAYOUT_PACKAGE_BYTES + 1,
  } as ArrayBuffer;

  await assert.rejects(readLayoutPackage(oversized), (error) =>
    Boolean(
      error instanceof InvalidLayoutPackageError &&
        error.code === "package_too_large",
    ),
  );
});

test("layout package round trips v2 layout data and referenced images", async () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.background.image = "background.png";
  layout.defaultbuttons.img = "button.png";
  const images = new Map([
    ["background.png", PNG_BYTES],
    ["button.png", PNG_BYTES],
  ]);

  const archive = await createLayoutPackage(layout, async (name) =>
    images.get(name),
  );
  const restored = await readLayoutPackage(archive);

  assert.equal(restored.layout.totalbuttonshow, 1);
  assert.equal(restored.layout.background.image, "background.png");
  assert.deepEqual(restored.assets, images);
});

test("readLayoutPackage rejects unsafe and unexpected archive paths", async () => {
  const zip = new JSZip();
  zip.file(
    "layout.json",
    JSON.stringify(serializeLayoutDocument(createDefaultLayout())),
  );
  zip.file("../escape.txt", "escape");

  await assert.rejects(
    readLayoutPackage(await zip.generateAsync({ type: "uint8array" })),
    (error) =>
      error instanceof InvalidLayoutPackageError &&
      error.code === "unsafe_path",
  );
});

test("readLayoutPackage rejects extra files and excessive file counts", async () => {
  const layoutJson = JSON.stringify(
    serializeLayoutDocument(createDefaultLayout()),
  );
  const extraZip = new JSZip();
  extraZip.file("layout.json", layoutJson);
  extraZip.file("notes.txt", "extra");
  await assert.rejects(
    readLayoutPackage(await extraZip.generateAsync({ type: "uint8array" })),
    (error) =>
      error instanceof InvalidLayoutPackageError &&
      error.code === "unexpected_file",
  );

  const crowdedZip = new JSZip();
  crowdedZip.file("layout.json", layoutJson);
  for (let index = 0; index < 128; index += 1)
    crowdedZip.file(`extra-${index}.txt`, "");
  await assert.rejects(
    readLayoutPackage(await crowdedZip.generateAsync({ type: "uint8array" })),
    (error) =>
      error instanceof InvalidLayoutPackageError &&
      error.code === "too_many_files",
  );
});

test("readLayoutPackage rejects image content that mismatches its extension", async () => {
  const layout = createDefaultLayout();
  layout.background.image = "background.png";
  const zip = new JSZip();
  zip.file("layout.json", JSON.stringify(serializeLayoutDocument(layout)));
  zip.file("assets/background.png", "GIF89a");

  await assert.rejects(
    readLayoutPackage(await zip.generateAsync({ type: "uint8array" })),
    (error) =>
      error instanceof InvalidLayoutPackageError &&
      error.code === "invalid_image_content",
  );
});

test("createLayoutPackage rejects a missing referenced image", async () => {
  const layout = createDefaultLayout();
  layout.background.image = "missing.png";

  await assert.rejects(
    createLayoutPackage(layout, async () => undefined),
    InvalidLayoutPackageError,
  );
});

test("readLayoutPackage rejects an archive missing a referenced image", async () => {
  const layout = createDefaultLayout();
  layout.background.image = "missing.png";
  const zip = new JSZip();
  zip.file("layout.json", JSON.stringify(serializeLayoutDocument(layout)));

  await assert.rejects(
    readLayoutPackage(await zip.generateAsync({ type: "uint8array" })),
    InvalidLayoutPackageError,
  );
});
