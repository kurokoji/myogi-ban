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

export type RectCorner = "nw" | "ne" | "sw" | "se";

export function dragRotation(
  initialRotation: number,
  center: Point,
  start: Point,
  current: Point,
): number {
  const pointerAngle = (point: Point) =>
    (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI;
  const rotation =
    initialRotation + pointerAngle(current) - pointerAngle(start);
  return Math.round(((rotation % 360) + 360) % 360);
}

export function resizeRectFromCorner(
  initial: Rect,
  corner: RectCorner,
  delta: Point,
  minimumSize: number,
  aspectRatioLocked = false,
): Rect {
  const movesLeft = corner.endsWith("w");
  const movesTop = corner.startsWith("n");
  const resized = {
    left: movesLeft
      ? Math.min(initial.left + delta.x, initial.right - minimumSize)
      : initial.left,
    top: movesTop
      ? Math.min(initial.top + delta.y, initial.bottom - minimumSize)
      : initial.top,
    right: movesLeft
      ? initial.right
      : Math.max(initial.right + delta.x, initial.left + minimumSize),
    bottom: movesTop
      ? initial.bottom
      : Math.max(initial.bottom + delta.y, initial.top + minimumSize),
  };
  if (!aspectRatioLocked) return resized;

  const initialWidth = initial.right - initial.left;
  const initialHeight = initial.bottom - initial.top;
  const ratio = initialWidth / initialHeight;
  const resizedWidth = resized.right - resized.left;
  const resizedHeight = resized.bottom - resized.top;
  const widthChangedMore =
    Math.abs(resizedWidth / initialWidth - 1) >=
    Math.abs(resizedHeight / initialHeight - 1);
  const width = widthChangedMore
    ? Math.max(resizedWidth, minimumSize, minimumSize * ratio)
    : Math.max(resizedHeight * ratio, minimumSize, minimumSize * ratio);
  const height = width / ratio;
  return {
    left: movesLeft ? initial.right - width : initial.left,
    top: movesTop ? initial.bottom - height : initial.top,
    right: movesLeft ? initial.right : initial.left + width,
    bottom: movesTop ? initial.bottom : initial.top + height,
  };
}

function rotatePoint(point: Point, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: point.x * Math.cos(radians) - point.y * Math.sin(radians),
    y: point.x * Math.sin(radians) + point.y * Math.cos(radians),
  };
}

export function resizeRotatedRectFromCorner(
  initial: Rect,
  corner: RectCorner,
  delta: Point,
  minimumSize: number,
  rotation: number,
  aspectRatioLocked: boolean,
): { x: number; y: number; width: number; height: number } {
  const localDelta = rotatePoint(delta, -rotation);
  const resized = resizeRectFromCorner(
    initial,
    corner,
    localDelta,
    minimumSize,
    aspectRatioLocked,
  );
  const initialCenter = {
    x: (initial.left + initial.right) / 2,
    y: (initial.top + initial.bottom) / 2,
  };
  const resizedCenterOffset = rotatePoint(
    {
      x: (resized.left + resized.right) / 2 - initialCenter.x,
      y: (resized.top + resized.bottom) / 2 - initialCenter.y,
    },
    rotation,
  );
  const stable = (value: number) => Math.round(value * 1e10) / 1e10;
  return {
    x: stable(initialCenter.x + resizedCenterOffset.x),
    y: stable(initialCenter.y + resizedCenterOffset.y),
    width: stable(resized.right - resized.left),
    height: stable(resized.bottom - resized.top),
  };
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
