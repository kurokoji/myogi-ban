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
