import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesheet = readFileSync("public/css/style.css", "utf8");
const editorStylesheet = readFileSync("public/css/editor.css", "utf8");

test("shared styles use the Fontsource M PLUS 2 variable family", () => {
  assert.match(stylesheet, /--app-font-family:\s*"M PLUS 2 Variable"/);
  assert.match(
    stylesheet,
    /--app-font-family-monospace:\s*"M PLUS Code Latin Variable"/,
  );
  assert.match(
    stylesheet,
    /--mantine-font-family:\s*var\(--app-font-family\);/,
  );
  assert.match(
    stylesheet,
    /--mantine-font-family-headings:\s*var\(--app-font-family\);/,
  );
  assert.match(
    stylesheet,
    /body\s*\{[^}]*font-family:\s*var\(--app-font-family\);/s,
  );
});

test("OBS URL uses the application monospace family", () => {
  assert.match(
    editorStylesheet,
    /\.server-url-value\s*\{[^}]*font-family:\s*var\(--mantine-font-family-monospace\);/s,
  );
});

test("preview ruler labels use the application monospace family", () => {
  assert.match(
    editorStylesheet,
    /\.preview-ruler\s*\{[^}]*font-size:\s*10px;/s,
  );
  assert.match(
    editorStylesheet,
    /\.preview-ruler-label\s*\{[^}]*font-family:\s*var\(--mantine-font-family-monospace\);/s,
  );
});

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

test("selection bounds do not render a redundant drag grip", () => {
  assert.doesNotMatch(editorStylesheet, /\.selection-bounds::before/);
});
