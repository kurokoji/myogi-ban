import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const stylesheet = readFileSync("public/css/style.css", "utf8");

test("viewer stylesheet does not contain legacy image stick rules", () => {
  assert.doesNotMatch(
    stylesheet,
    /layout\/preset\/stick-(?:back|center|up)\.png/,
  );
  assert.doesNotMatch(stylesheet, /\.stick:not\(\[class="stick"\]\)/);
  assert.doesNotMatch(stylesheet, /\[class="stick"\]/);
});
