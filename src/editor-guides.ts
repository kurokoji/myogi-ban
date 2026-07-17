export function guideCoordinateFromPointer(
  clientPosition: number,
  previewStart: number,
  rulerOrigin: number,
  previewScale: number,
): number {
  return Math.round(
    (clientPosition - previewStart - rulerOrigin) / previewScale,
  );
}
