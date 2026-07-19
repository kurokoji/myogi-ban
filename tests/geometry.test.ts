import assert from "node:assert/strict";
import test from "node:test";
import {
  dragGroupPositions,
  dragPosition,
  rectsIntersect,
  rectsOnSnapGuides,
  resolveRectSnap,
  snapRect,
  snapRectDelta,
  unionRectsAtIndexes,
} from "../src/geometry";

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
