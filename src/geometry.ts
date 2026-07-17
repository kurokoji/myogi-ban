export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.left <= b.right &&
    a.right >= b.left &&
    a.top <= b.bottom &&
    a.bottom >= b.top
  );
}
