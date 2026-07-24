export const MIN_PREVIEW_SCALE = 0.1;
export const MAX_PREVIEW_SCALE = 3;

export function clampPreviewScale(scale: number): number {
  const clamped = Math.min(
    MAX_PREVIEW_SCALE,
    Math.max(MIN_PREVIEW_SCALE, scale),
  );
  return Math.round(clamped * 10) / 10;
}

export function zoomPreviewScale(current: number, delta: number): number {
  return clampPreviewScale(current + delta);
}

export function previewWheelZoomDelta(event: {
  deltaY: number;
  ctrlKey: boolean;
  metaKey: boolean;
}): number | null {
  if ((!event.ctrlKey && !event.metaKey) || event.deltaY === 0) return null;
  return event.deltaY < 0 ? 0.1 : -0.1;
}
