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

test("layout documents round trip pill button shapes", () => {
  const source = createDefaultLayout();
  source.defaultbuttons.cssShape = "pill";
  source.buttons[0].cssShape = "pill";

  const restored = deserializeLayoutDocument(serializeLayoutDocument(source));

  assert.equal(restored.defaultbuttons.cssShape, "pill");
  assert.equal(restored.buttons[0].cssShape, undefined);
});

test("layout documents round trip button text, color, and size", () => {
  const source = createDefaultLayout();
  source.defaultbuttons.cssTextColor = "#111111";
  source.defaultbuttons.cssTextSize = "20";
  source.buttons[0].text = "P1";
  source.buttons[0].cssTextColor = "#eeeeee";
  source.buttons[0].cssTextSize = "32";

  const document = serializeLayoutDocument(source);
  assert.equal(document.buttonDefaults.textColor, "#111111");
  assert.equal(document.buttonDefaults.textSize, 20);
  assert.equal(document.buttons[0]?.text, "P1");
  assert.equal(document.buttons[0]?.textColor, "#eeeeee");
  assert.equal(document.buttons[0]?.textSize, 32);

  const restored = deserializeLayoutDocument(document);
  assert.equal(restored.defaultbuttons.cssTextColor, "#111111");
  assert.equal(restored.defaultbuttons.cssTextSize, "20");
  assert.equal(restored.buttons[0].text, "P1");
  assert.equal(restored.buttons[0].cssTextColor, "#eeeeee");
  assert.equal(restored.buttons[0].cssTextSize, "32");
});

test("layout documents round trip default and per-button border colors", () => {
  const source = createDefaultLayout();
  source.defaultbuttons.cssBorderColor = "#112233";
  source.buttons[0].cssBorderColor = "#aabbcc";

  const document = serializeLayoutDocument(source);
  assert.equal(document.buttonDefaults.borderColor, "#112233");
  assert.equal(document.buttons[0]?.borderColor, "#aabbcc");

  const restored = deserializeLayoutDocument(document);
  assert.equal(restored.defaultbuttons.cssBorderColor, "#112233");
  assert.equal(restored.buttons[0].cssBorderColor, "#aabbcc");
});

test("layout documents round trip whether borders match normal colors", () => {
  const source = createDefaultLayout();
  source.defaultbuttons.cssBorderMatchesColor = false;
  source.buttons[0].cssBorderMatchesColor = true;

  const document = serializeLayoutDocument(source);
  assert.equal(document.buttonDefaults.borderMatchesColor, false);
  assert.equal(document.buttons[0]?.borderMatchesColor, true);

  const restored = deserializeLayoutDocument(document);
  assert.equal(restored.defaultbuttons.cssBorderMatchesColor, false);
  assert.equal(restored.buttons[0].cssBorderMatchesColor, true);
});

test("layout documents round trip bold, italic, and outline text styling", () => {
  const source = createDefaultLayout();
  source.buttons[0].text = "P1";
  source.buttons[0].cssTextBold = true;
  source.buttons[0].cssTextItalic = true;
  source.buttons[0].cssTextOutline = true;
  source.buttons[0].cssTextOutlineColor = "#00ff00";

  const document = serializeLayoutDocument(source);
  assert.equal(document.buttons[0]?.bold, true);
  assert.equal(document.buttons[0]?.italic, true);
  assert.equal(document.buttons[0]?.outline, true);
  assert.equal(document.buttons[0]?.outlineColor, "#00ff00");

  const restored = deserializeLayoutDocument(document);
  assert.equal(restored.buttons[0].cssTextBold, true);
  assert.equal(restored.buttons[0].cssTextItalic, true);
  assert.equal(restored.buttons[0].cssTextOutline, true);
  assert.equal(restored.buttons[0].cssTextOutlineColor, "#00ff00");
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
