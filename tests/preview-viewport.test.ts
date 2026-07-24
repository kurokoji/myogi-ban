import assert from "node:assert/strict";
import test from "node:test";
import {
  clampPreviewScale,
  previewWheelZoomDelta,
  zoomPreviewScale,
} from "../src/preview-viewport";

test("preview wheel zoom requires a command modifier and follows direction", () => {
  assert.equal(
    previewWheelZoomDelta({ deltaY: -10, ctrlKey: true, metaKey: false }),
    0.1,
  );
  assert.equal(
    previewWheelZoomDelta({ deltaY: 10, ctrlKey: false, metaKey: true }),
    -0.1,
  );
  assert.equal(
    previewWheelZoomDelta({ deltaY: -10, ctrlKey: false, metaKey: false }),
    null,
  );
});

test("preview scale clamps to limits and rounds to tenths", () => {
  assert.equal(clampPreviewScale(0), 0.1);
  assert.equal(clampPreviewScale(4), 3);
  assert.equal(clampPreviewScale(1.26), 1.3);
});

test("zoomPreviewScale applies a delta before clamping", () => {
  assert.equal(zoomPreviewScale(2.95, 0.1), 3);
});
