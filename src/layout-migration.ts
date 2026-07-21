import type { BackgroundConfig, Layout } from "./types";

export const CURRENT_LAYOUT_VERSION = "v1.0.11";

export function migrateLayout(layout: Partial<Layout>): Partial<Layout> {
  const background = layout.background
    ? { ...(layout.background as Partial<BackgroundConfig>) }
    : undefined;
  if (
    background &&
    !("scale" in background) &&
    (background.w || background.h)
  ) {
    background.scale = "";
  }
  return {
    ...layout,
    version: CURRENT_LAYOUT_VERSION,
    ...(background ? { background: background as BackgroundConfig } : {}),
  };
}
