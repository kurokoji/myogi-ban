export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface Point {
  x: number;
  y: number;
}

export function dragPosition(
  initial: Point,
  start: Point,
  current: Point,
): Point {
  return {
    x: Math.round(initial.x + current.x - start.x),
    y: Math.round(initial.y + current.y - start.y),
  };
}

export function dragGroupPositions(
  items: Array<{ index: number; initialX: number; initialY: number }>,
  start: Point,
  current: Point,
): Array<{ index: number; x: number; y: number }> {
  return items.map((item) => ({
    index: item.index,
    ...dragPosition({ x: item.initialX, y: item.initialY }, start, current),
  }));
}

function nearestSnapCorrection(
  movingAnchors: number[],
  targetAnchors: number[],
  threshold: number,
): { correction: number; guide?: number } {
  let correction = 0;
  let guide: number | undefined;
  let nearestDistance = threshold + 1;
  for (const moving of movingAnchors) {
    for (const target of targetAnchors) {
      const difference = target - moving;
      const distance = Math.abs(difference);
      if (distance < nearestDistance) {
        correction = difference;
        guide = target;
        nearestDistance = distance;
      }
    }
  }
  return nearestDistance <= threshold ? { correction, guide } : { correction };
}

export function snapRect(
  movingRect: Rect,
  delta: Point,
  targets: Rect[],
  threshold: number,
): { delta: Point; guideX?: number; guideY?: number } {
  const movingX = [
    movingRect.left + delta.x,
    (movingRect.left + movingRect.right) / 2 + delta.x,
    movingRect.right + delta.x,
  ];
  const movingY = [
    movingRect.top + delta.y,
    (movingRect.top + movingRect.bottom) / 2 + delta.y,
    movingRect.bottom + delta.y,
  ];
  const targetX = targets.flatMap((target) => [
    target.left,
    (target.left + target.right) / 2,
    target.right,
  ]);
  const targetY = targets.flatMap((target) => [
    target.top,
    (target.top + target.bottom) / 2,
    target.bottom,
  ]);
  const horizontalSnap = nearestSnapCorrection(movingX, targetX, threshold);
  const verticalSnap = nearestSnapCorrection(movingY, targetY, threshold);
  return {
    delta: {
      x: delta.x + horizontalSnap.correction,
      y: delta.y + verticalSnap.correction,
    },
    guideX: horizontalSnap.guide,
    guideY: verticalSnap.guide,
  };
}

export function resolveRectSnap(
  enabled: boolean,
  movingRect: Rect,
  delta: Point,
  targets: Rect[],
  threshold: number,
): { delta: Point; guideX?: number; guideY?: number } {
  return enabled ? snapRect(movingRect, delta, targets, threshold) : { delta };
}

export function snapRectDelta(
  movingRect: Rect,
  delta: Point,
  targets: Rect[],
  threshold: number,
): Point {
  return snapRect(movingRect, delta, targets, threshold).delta;
}

export function rectsOnSnapGuides(
  targets: Rect[],
  guideX?: number,
  guideY?: number,
): Rect[] {
  return targets.filter((target) => {
    const xAnchors = [
      target.left,
      (target.left + target.right) / 2,
      target.right,
    ];
    const yAnchors = [
      target.top,
      (target.top + target.bottom) / 2,
      target.bottom,
    ];
    return (
      (guideX !== undefined && xAnchors.includes(guideX)) ||
      (guideY !== undefined && yAnchors.includes(guideY))
    );
  });
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.left <= b.right &&
    a.right >= b.left &&
    a.top <= b.bottom &&
    a.bottom >= b.top
  );
}

export function unionRectsAtIndexes(
  rects: Rect[],
  indexes: number[],
): Rect | null {
  let result: Rect | null = null;
  for (const index of indexes) {
    const rect = rects[index];
    if (!rect) continue;
    result = result
      ? {
          left: Math.min(result.left, rect.left),
          top: Math.min(result.top, rect.top),
          right: Math.max(result.right, rect.right),
          bottom: Math.max(result.bottom, rect.bottom),
        }
      : { ...rect };
  }
  return result;
}
