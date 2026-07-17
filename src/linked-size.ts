interface ResizeWithAspectRatioOptions {
  width: string;
  height: string;
  nextValue: string | number;
  changed: "width" | "height";
  linked: boolean;
  fallbackWidth?: string;
  fallbackHeight?: string;
}

function effectiveNumber(value: string, fallback = ""): number | null {
  const parsed = Number.parseFloat(value || fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatDimension(value: number): string {
  return String(Math.round(value * 10000) / 10000);
}

export function resizeWithAspectRatio({
  width,
  height,
  nextValue,
  changed,
  linked,
  fallbackWidth,
  fallbackHeight,
}: ResizeWithAspectRatioOptions): { width: string; height: string } {
  const nextDimension = String(nextValue ?? "");
  const currentWidth = effectiveNumber(width, fallbackWidth);
  const currentHeight = effectiveNumber(height, fallbackHeight);
  const nextNumber = effectiveNumber(nextDimension);
  if (changed === "height") {
    if (
      !linked ||
      nextNumber === null ||
      currentWidth === null ||
      currentHeight === null
    ) {
      return { width, height: nextDimension };
    }
    return {
      width: formatDimension((nextNumber * currentWidth) / currentHeight),
      height: nextDimension,
    };
  }
  if (
    !linked ||
    nextNumber === null ||
    currentWidth === null ||
    currentHeight === null
  ) {
    return { width: nextDimension, height };
  }
  return {
    width: nextDimension,
    height: formatDimension((nextNumber * currentHeight) / currentWidth),
  };
}
