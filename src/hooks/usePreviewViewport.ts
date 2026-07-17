import { useCallback, useMemo, useState } from "react";
import {
  clampPreviewScale,
  MAX_PREVIEW_SCALE,
  MIN_PREVIEW_SCALE,
  zoomPreviewScale,
} from "../preview-viewport";
import { createSignedRulerTicks } from "../ruler-ticks";
import type { BackgroundConfig } from "../types";

const RULER_EXTRA_LENGTH = 1000;

function layoutSize(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function usePreviewViewport(background: BackgroundConfig) {
  const [previewScale, setPreviewScale] = useState(1);
  const previewWidth = layoutSize(background.w, 500);
  const previewHeight = layoutSize(background.h, 250);
  const rulerTicks = useMemo(
    () =>
      createSignedRulerTicks(
        Math.ceil(
          (Math.max(previewWidth, previewHeight) + RULER_EXTRA_LENGTH) /
            previewScale,
        ),
      ),
    [previewHeight, previewScale, previewWidth],
  );

  const changePreviewScale = useCallback((scale: number) => {
    setPreviewScale(clampPreviewScale(scale));
  }, []);

  const zoomPreview = useCallback((delta: number) => {
    setPreviewScale((current) => zoomPreviewScale(current, delta));
  }, []);

  return {
    canZoomIn: previewScale < MAX_PREVIEW_SCALE,
    canZoomOut: previewScale > MIN_PREVIEW_SCALE,
    changePreviewScale,
    previewScale,
    rulerTicks,
    scaledPreviewHeight: Math.ceil(previewHeight * previewScale),
    scaledPreviewWidth: Math.ceil(previewWidth * previewScale),
    zoomPercent: Math.round(previewScale * 100),
    zoomPreview,
  };
}
