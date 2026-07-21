import assert from "node:assert/strict";
import test from "node:test";
import JSZip from "jszip";
import { createDefaultLayout } from "../src/layout";
import { serializeLayoutDocument } from "../src/layout-document";
import {
  createLayoutPackage,
  InvalidLayoutPackageError,
  readLayoutPackage,
} from "../src/layout-package";

test("layout package round trips v2 layout data and referenced images", async () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.background.image = "background.png";
  layout.defaultbuttons.img = "button.png";
  const images = new Map([
    ["background.png", new Uint8Array([1, 2, 3])],
    ["button.png", new Uint8Array([4, 5, 6])],
  ]);

  const archive = await createLayoutPackage(layout, async (name) =>
    images.get(name),
  );
  const restored = await readLayoutPackage(archive);

  assert.equal(restored.layout.totalbuttonshow, 1);
  assert.equal(restored.layout.background.image, "background.png");
  assert.deepEqual(restored.assets, images);
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
