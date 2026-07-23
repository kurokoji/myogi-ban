import { DEFAULT_BACKGROUND_SIZE } from "./app-constants";
import type { Layout } from "./types";

export interface LayoutDimensions {
  width: number;
  height: number;
}

function positiveDimension(value: string, fallback: number): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function resolveLayoutDimensions(layout: Layout): LayoutDimensions {
  return {
    width: positiveDimension(
      layout.background.w,
      DEFAULT_BACKGROUND_SIZE.width,
    ),
    height: positiveDimension(
      layout.background.h,
      DEFAULT_BACKGROUND_SIZE.height,
    ),
  };
}
