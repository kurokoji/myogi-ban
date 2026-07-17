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

export function updateGuidePosition(
  guides: number[],
  index: number,
  value: number,
  limit?: number,
): number[] {
  if (limit !== undefined && (value < 0 || value > limit)) {
    return guides.filter((_, current) => current !== index);
  }
  return guides.map((guide, current) => (current === index ? value : guide));
}
