import { useCallback, useMemo, useState } from "react";
import { createSignedRulerTicks } from "../editor-helpers";
import type { BackgroundConfig } from "../types";

const MIN_SCALE = 0.1;
const MAX_SCALE = 3;
const RULER_EXTRA_LENGTH = 1000;

function clampScale(scale: number): number {
  const nextScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
  return Math.round(nextScale * 10) / 10;
}

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
    setPreviewScale(clampScale(scale));
  }, []);

  const zoomPreview = useCallback((delta: number) => {
    setPreviewScale((current) => clampScale(current + delta));
  }, []);

  return {
    canZoomIn: previewScale < MAX_SCALE,
    canZoomOut: previewScale > MIN_SCALE,
    changePreviewScale,
    previewScale,
    rulerTicks,
    scaledPreviewHeight: Math.ceil(previewHeight * previewScale),
    scaledPreviewWidth: Math.ceil(previewWidth * previewScale),
    zoomPercent: Math.round(previewScale * 100),
    zoomPreview,
  };
}
