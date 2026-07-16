import assert from "node:assert/strict";
import test from "node:test";
import { collectLayoutAssets } from "../src/layout-repository";

test("collectLayoutAssets returns safe unique image names", () => {
  const assets = collectLayoutAssets({
    background: { image: "images/background.png" },
    defaultbuttons: {
      img: "released.png",
      imgp: "pressed.png",
    },
    buttons: [
      { img: "nested/released.png", imgp: "button-pressed.png" },
      { img: "", imgp: null },
    ],
  });

  assert.deepEqual(assets, [
    "background.png",
    "released.png",
    "pressed.png",
    "button-pressed.png",
  ]);
});
