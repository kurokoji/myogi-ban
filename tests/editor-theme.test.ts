import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { editorTheme } from "../src/editor-theme";

test("editor theme keeps Mantine text on the bundled app font", () => {
  assert.equal(editorTheme.fontFamily, "var(--app-font-family)");
  assert.equal(editorTheme.headings?.fontFamily, "var(--app-font-family)");
  assert.equal(
    editorTheme.fontFamilyMonospace,
    "var(--app-font-family-monospace)",
  );
});

test("editor provides the app font theme to Mantine", () => {
  const editorSource = readFileSync("src/editor.tsx", "utf8");

  assert.match(
    editorSource,
    /<MantineProvider[^>]*theme=\{editorTheme\}[^>]*>/,
  );
  assert.match(editorSource, /className="server-url-value"/);
});
