import assert from "node:assert/strict";
import test from "node:test";
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
