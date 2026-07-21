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

test("editor title row leaves a small gap below the title", () => {
  assert.match(
    editorStylesheet,
    /\.sidebar-title-row\s*\{[^}]*margin-bottom:\s*10px;/s,
  );
});

test("preview rulers reserve a separate top-left corner", () => {
  assert.match(
    editorStylesheet,
    /#preview-scroll\s*\{[^}]*--preview-ruler-size:\s*34px;/s,
  );
  assert.match(
    editorStylesheet,
    /\.preview-ruler-horizontal\s*\{[^}]*left:\s*var\(--preview-ruler-size\);/s,
  );
  assert.match(
    editorStylesheet,
    /\.preview-ruler-vertical\s*\{[^}]*top:\s*var\(--preview-ruler-size\);/s,
  );
  assert.match(editorStylesheet, /\.preview-ruler-corner\s*\{/);
});

test("long background image names shrink before the file button", () => {
  assert.match(
    editorStylesheet,
    /\.background-image-name\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;/s,
  );
});

test("preview snapping icon is explicitly centered across platforms", () => {
  assert.match(
    editorStylesheet,
    /\.preview-snapping-button\s*\{[^}]*display:\s*inline-grid;[^}]*place-items:\s*center;/s,
  );
  assert.match(
    editorStylesheet,
    /\.preview-snapping-button svg\s*\{[^}]*display:\s*block;[^}]*margin:\s*auto;/s,
  );
});
