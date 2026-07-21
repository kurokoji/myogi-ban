import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultLayout } from "../src/layout";
import {
  CURRENT_LAYOUT_FORMAT_VERSION,
  deserializeLayoutDocument,
  serializeLayoutDocument,
} from "../src/layout-document";
import { CURRENT_LAYOUT_VERSION } from "../src/layout-migration";
import { TOTAL_BUTTONS } from "../src/types";

test("serializeLayoutDocument writes numeric v2 data for visible buttons only", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 2;
  layout.buttonMappings = [3, 4];
  layout.stickMappings = [10, 11, 12, 13];

  const document = serializeLayoutDocument(layout);

  assert.equal(document.formatVersion, CURRENT_LAYOUT_FORMAT_VERSION);
  assert.equal("version" in document, false);
  assert.deepEqual(document.stick.position, { x: 130, y: 105 });
  assert.deepEqual(document.buttonDefaults.size, { width: 48, height: 48 });
  assert.equal(document.buttons.length, 2);
  assert.deepEqual(document.buttons[0]?.position, { x: 225, y: 80 });
  assert.deepEqual(document.mappings, {
    buttons: [3, 4],
    stick: [10, 11, 12, 13],
  });
});

test("deserializeLayoutDocument restores v2 data to the runtime layout", () => {
  const source = createDefaultLayout();
  source.totalbuttonshow = 2;
  source.buttons[1].rotation = "15";
  source.buttonMappings = [3, 4];

  const restored = deserializeLayoutDocument(serializeLayoutDocument(source));

  assert.equal(restored.version, CURRENT_LAYOUT_VERSION);
  assert.equal(restored.totalbuttonshow, 2);
  assert.equal(restored.buttons.length, TOTAL_BUTTONS);
  assert.equal(restored.buttons[0].x, "225");
  assert.equal(restored.buttons[1].rotation, "15");
  assert.equal(restored.buttons[2].w, "");
  assert.deepEqual(restored.buttonMappings, [3, 4]);
  assert.equal(restored.sourceFormatVersion, 2);
});

test("deserializeLayoutDocument keeps v1 documents readable", () => {
  const restored = deserializeLayoutDocument({
    version: "v1.0.5",
    name: "legacy",
    totalbuttonshow: 1,
    buttons: [{ x: "42", y: "24" }],
  });

  assert.equal(restored.name, "legacy");
  assert.equal(restored.totalbuttonshow, 1);
  assert.equal(restored.buttons[0].x, "42");
  assert.equal(restored.buttons[0].y, "24");
  assert.equal(restored.sourceFormatVersion, 1);
});

test("legacy numeric fields can be saved as a v2 document", () => {
  const restored = deserializeLayoutDocument({
    version: "210124",
    name: "legacy-numeric",
    totalbuttonshow: 1,
    stick: { x: 89, y: 116, w: 70, h: 70, cssTransition: 0.1 },
    defaultbuttons: {
      x: 0,
      y: 0,
      w: 40,
      h: 40,
      xp: 0,
      yp: 0,
      wp: 40,
      hp: 40,
    },
    buttons: [{ x: 250, y: 90, w: 40, h: 40, xp: 0, yp: 0, wp: 40, hp: 40 }],
    background: {
      show: true,
      image: "background.png",
      scale: 0.1,
      w: 375,
      h: 234,
    },
  });

  const document = serializeLayoutDocument(restored);

  assert.deepEqual(document.stick.position, { x: 89, y: 116 });
  assert.deepEqual(document.buttons[0]?.position, { x: 250, y: 90 });
  assert.deepEqual(document.background.size, { width: 375, height: 234 });
});

test("deserializeLayoutDocument rejects unknown format versions", () => {
  assert.throws(
    () => deserializeLayoutDocument({ formatVersion: 3 }),
    /Unsupported layout format/,
  );
});
