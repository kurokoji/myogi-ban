import assert from "node:assert/strict";
import test from "node:test";
import { cssVariables } from "../src/style-types";

test("cssVariables preserves typed custom property values", () => {
  assert.deepEqual(cssVariables({ "--button-color": "#fff", opacity: 0.5 }), {
    "--button-color": "#fff",
    opacity: 0.5,
  });
});
