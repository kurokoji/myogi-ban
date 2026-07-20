import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesheet = readFileSync("public/css/style.css", "utf8");
const editorStylesheet = readFileSync("public/css/editor.css", "utf8");

test("viewer stylesheet does not contain legacy image stick rules", () => {
  assert.doesNotMatch(
    stylesheet,
    /layout\/preset\/stick-(?:back|center|up)\.png/,
  );
  assert.doesNotMatch(stylesheet, /\.stick:not\(\[class="stick"\]\)/);
  assert.doesNotMatch(stylesheet, /\[class="stick"\]/);
});

test("viewer stylesheet does not request legacy preset button images", () => {
  assert.doesNotMatch(
    stylesheet,
    /layout\/preset\/button-(?:released|pressed)\.png/,
  );
});

test("editor borders follow the active color scheme", () => {
  assert.doesNotMatch(editorStylesheet, /var\(--mantine-color-gray-3\)/);
  assert.match(editorStylesheet, /var\(--mantine-color-default-border\)/);
});
