import assert from "node:assert/strict";
import test from "node:test";
import {
  dragGroupPositions,
  dragPosition,
  dragRotation,
  rectsIntersect,
  rectsOnSnapGuides,
  resizeRectFromCorner,
  resizeRotatedRectFromCorner,
  resolveRectSnap,
  snapRect,
  snapRectDelta,
  unionRectsAtIndexes,
} from "../src/geometry";

test("dragRotation adds the pointer angle change to the initial rotation", () => {
  assert.equal(
    dragRotation(30, { x: 100, y: 100 }, { x: 100, y: 50 }, { x: 150, y: 100 }),
    120,
  );
});

test("dragRotation normalizes a negative result into degrees", () => {
  assert.equal(
    dragRotation(10, { x: 100, y: 100 }, { x: 150, y: 100 }, { x: 100, y: 50 }),
    280,
  );
});

test("resizeRectFromCorner grows a rectangle from its bottom-right corner", () => {
  assert.deepEqual(
    resizeRectFromCorner(
      { left: 10, top: 20, right: 70, bottom: 60 },
      "se",
      { x: 15, y: 10 },
      12,
    ),
    { left: 10, top: 20, right: 85, bottom: 70 },
  );
});

test("resizeRectFromCorner moves the selected corner and enforces a minimum size", () => {
  assert.deepEqual(
    resizeRectFromCorner(
      { left: 10, top: 20, right: 70, bottom: 60 },
      "nw",
      { x: 100, y: 100 },
      12,
    ),
    { left: 58, top: 48, right: 70, bottom: 60 },
  );
});

test("resizeRectFromCorner preserves the initial aspect ratio when locked", () => {
  assert.deepEqual(
    resizeRectFromCorner(
      { left: 10, top: 20, right: 70, bottom: 60 },
      "se",
      { x: 30, y: 5 },
      12,
      true,
    ),
    { left: 10, top: 20, right: 100, bottom: 80 },
  );
});

test("resizeRotatedRectFromCorner resizes along the rotated local axes", () => {
  assert.deepEqual(
    resizeRotatedRectFromCorner(
      { left: 70, top: 60, right: 130, bottom: 100 },
      "se",
      { x: 0, y: 20 },
      12,
      90,
      false,
    ),
    { x: 100, y: 90, width: 80, height: 40 },
  );
});

test("rectsIntersect detects overlap and touching edges", () => {
  const rect = { left: 0, top: 0, right: 10, bottom: 10 };
  assert.equal(
    rectsIntersect(rect, { left: 5, top: 5, right: 15, bottom: 15 }),
    true,
  );
  assert.equal(
    rectsIntersect(rect, { left: 10, top: 2, right: 20, bottom: 8 }),
    true,
  );
});

test("rectsIntersect rejects separated rectangles", () => {
  const rect = { left: 0, top: 0, right: 10, bottom: 10 };
  assert.equal(
    rectsIntersect(rect, { left: 11, top: 0, right: 20, bottom: 10 }),
    false,
  );
});

test("dragPosition applies pointer delta and rounds coordinates", () => {
  assert.deepEqual(
    dragPosition({ x: 100, y: 50 }, { x: 10, y: 20 }, { x: 15.4, y: 17.6 }),
    { x: 105, y: 48 },
  );
});

test("dragGroupPositions applies one pointer delta to every item", () => {
  assert.deepEqual(
    dragGroupPositions(
      [
        { index: 1, initialX: 10, initialY: 20 },
        { index: 3, initialX: 30, initialY: 40 },
      ],
      { x: 5, y: 5 },
      { x: 8.4, y: 3.2 },
    ),
    [
      { index: 1, x: 13, y: 18 },
      { index: 3, x: 33, y: 38 },
    ],
  );
});

test("unionRectsAtIndexes visits selected rectangles by index", () => {
  const rects = [
    { left: 0, top: 0, right: 10, bottom: 10 },
    { left: 20, top: 20, right: 30, bottom: 30 },
    { left: -5, top: 5, right: 5, bottom: 15 },
  ];

  assert.deepEqual(unionRectsAtIndexes(rects, [0, 2, 99]), {
    left: -5,
    top: 0,
    right: 10,
    bottom: 15,
  });
  assert.equal(unionRectsAtIndexes(rects, []), null);
});

test("snapRectDelta aligns nearby moving edges with target edges", () => {
  const result = snapRectDelta(
    { left: 10, top: 10, right: 50, bottom: 50 },
    { x: 47, y: 18 },
    [{ left: 100, top: 30, right: 140, bottom: 70 }],
    6,
  );

  assert.deepEqual(result, { x: 50, y: 20 });
});

test("snapRect reports the coordinates used for alignment guides", () => {
  const result = snapRect(
    { left: 10, top: 10, right: 50, bottom: 50 },
    { x: 47, y: 18 },
    [{ left: 100, top: 30, right: 140, bottom: 70 }],
    6,
  );

  assert.deepEqual(result, {
    delta: { x: 50, y: 20 },
    guideX: 100,
    guideY: 30,
  });
});

test("rectsOnSnapGuides identifies the buttons aligned to active guides", () => {
  const targets = [
    { left: 80, top: 30, right: 120, bottom: 70 },
    { left: 180, top: 130, right: 220, bottom: 170 },
  ];

  assert.deepEqual(rectsOnSnapGuides(targets, 100, 150), targets);
  assert.deepEqual(rectsOnSnapGuides(targets, 80, undefined), [targets[0]]);
});

test("resolveRectSnap preserves raw movement when snapping is disabled", () => {
  const result = resolveRectSnap(
    false,
    { left: 10, top: 10, right: 50, bottom: 50 },
    { x: 47, y: 18 },
    [{ left: 100, top: 30, right: 140, bottom: 70 }],
    6,
  );

  assert.deepEqual(result, { delta: { x: 47, y: 18 } });
});
