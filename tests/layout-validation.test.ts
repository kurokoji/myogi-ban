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
