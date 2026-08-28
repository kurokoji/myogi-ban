import type { Rect } from "../../geometry";

export function pointerToLocal(
  event: { clientX: number; clientY: number },
  element: HTMLElement,
  size: { width: number; height: number },
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  const scaleX = rect.width ? size.width / rect.width : 1;
  const scaleY = rect.height ? size.height / rect.height : 1;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

export function normalizedRect(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): Rect {
  return {
    left: Math.min(startX, endX),
    top: Math.min(startY, endY),
    right: Math.max(startX, endX),
    bottom: Math.max(startY, endY),
  };
}
