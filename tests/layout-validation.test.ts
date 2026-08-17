import assert from "node:assert/strict";
import test from "node:test";
import { createDefaultLayout } from "../src/layout";
import { serializeLayoutDocument } from "../src/layout-document";
import { parseImportedLayoutJson } from "../src/layout-validation";

test("parseImportedLayoutJson accepts partial legacy layouts", () => {
  assert.deepEqual(parseImportedLayoutJson('{"name":"legacy","buttons":[]}'), {
    name: "legacy",
    buttons: [],
  });
});

test("parseImportedLayoutJson accepts pill button shapes", () => {
  const parsed = parseImportedLayoutJson(
    '{"defaultbuttons":{"cssShape":"pill"},"buttons":[{"cssShape":"pill"}]}',
  );

  assert.equal(parsed.defaultbuttons?.cssShape, "pill");
  assert.equal(parsed.buttons?.[0]?.cssShape, "pill");
});

test("parseImportedLayoutJson accepts a legacy button text label", () => {
  const parsed = parseImportedLayoutJson(
    '{"defaultbuttons":{"cssTextColor":"#111111"},"buttons":[{"text":"P1","cssTextSize":"20"}]}',
  );

  assert.equal(parsed.defaultbuttons?.cssTextColor, "#111111");
  assert.equal(parsed.buttons?.[0]?.text, "P1");
  assert.equal(parsed.buttons?.[0]?.cssTextSize, "20");
});

test("parseImportedLayoutJson rejects a non-string button text field", () => {
  assert.throws(
    () => parseImportedLayoutJson('{"buttons":[{"cssTextSize":20}]}'),
    /Invalid layout/,
  );
});

test("parseImportedLayoutJson accepts bold, italic, and outline text styling", () => {
  const parsed = parseImportedLayoutJson(
    '{"buttons":[{"cssTextBold":true,"cssTextItalic":true,"cssTextOutline":true,"cssTextOutlineColor":"#00ff00"}]}',
  );

  assert.equal(parsed.buttons?.[0]?.cssTextBold, true);
  assert.equal(parsed.buttons?.[0]?.cssTextItalic, true);
  assert.equal(parsed.buttons?.[0]?.cssTextOutline, true);
  assert.equal(parsed.buttons?.[0]?.cssTextOutlineColor, "#00ff00");
});

test("parseImportedLayoutJson rejects a non-string pressed border color", () => {
  assert.throws(
    () => parseImportedLayoutJson('{"buttons":[{"cssPressedBorderColor":16}]}'),
    /Invalid layout/,
  );
});

test("parseImportedLayoutJson rejects a non-boolean outline flag", () => {
  assert.throws(
    () => parseImportedLayoutJson('{"buttons":[{"cssTextOutline":"yes"}]}'),
    /Invalid layout/,
  );
});

test("parseImportedLayoutJson rejects invalid known field types", () => {
  assert.throws(
    () => parseImportedLayoutJson('{"buttons":{},"showstick":"yes"}'),
    /Invalid layout/,
  );
  assert.throws(() => parseImportedLayoutJson("[]"), /Invalid layout/);
});

test("parseImportedLayoutJson converts v2 documents to runtime layouts", () => {
  const source = createDefaultLayout();
  source.totalbuttonshow = 1;
  const document = {
    ...serializeLayoutDocument(source),
    formatVersion: 2 as const,
  };
  delete (document as { id?: string }).id;

  const parsed = parseImportedLayoutJson(JSON.stringify(document));

  assert.equal(parsed.totalbuttonshow, 1);
  assert.equal(parsed.buttons?.[0]?.x, "225");
});

test("parseImportedLayoutJson converts v3 documents to runtime layouts", () => {
  const source = createDefaultLayout();
  source.totalbuttonshow = 1;

  const parsed = parseImportedLayoutJson(
    JSON.stringify(serializeLayoutDocument(source)),
  );

  assert.equal(parsed.totalbuttonshow, 1);
  assert.equal(parsed.buttons?.[0]?.x, "225");
});

test("parseImportedLayoutJson rejects malformed v2 documents", () => {
  const malformed = serializeLayoutDocument(createDefaultLayout());
  (malformed.buttons[0].position as { x: unknown }).x = "225";
  assert.throws(
    () => parseImportedLayoutJson(JSON.stringify(malformed)),
    /Invalid layout/,
  );
});
