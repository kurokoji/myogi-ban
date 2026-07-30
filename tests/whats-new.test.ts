import assert from "node:assert/strict";
import test from "node:test";
import { resolveWhatsNewState } from "../src/whats-new";

test("resolveWhatsNewState shows nothing on the very first run", () => {
  assert.deepEqual(resolveWhatsNewState(null, "1.0.18"), {
    show: false,
    version: "1.0.18",
  });
});

test("resolveWhatsNewState shows notes when the version changed since last seen", () => {
  assert.deepEqual(resolveWhatsNewState("1.0.17", "1.0.18"), {
    show: true,
    version: "1.0.18",
  });
});

test("resolveWhatsNewState shows nothing when already on the last seen version", () => {
  assert.deepEqual(resolveWhatsNewState("1.0.18", "1.0.18"), {
    show: false,
    version: "1.0.18",
  });
});
