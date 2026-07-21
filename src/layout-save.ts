import { cloneLayout } from "./editor-helpers";
import type { ButtonMapping, StickMapping } from "./gamepad";
import { CURRENT_LAYOUT_VERSION } from "./layout-migration";
import { createLayoutSnapshotSignature } from "./layout-snapshot";
import type { Layout } from "./types";

export function createEditorSnapshotSignature(
  layout: Layout,
  buttonMappings: ButtonMapping[],
  stickMappings: StickMapping[],
): string {
  return createLayoutSnapshotSignature(layout, buttonMappings, stickMappings);
}

export function buildLayoutForSave(
  layout: Layout,
  name: string,
  buttonMappings: ButtonMapping[],
  stickMappings: StickMapping[],
): Layout {
  const saved = cloneLayout(layout);
  return {
    ...saved,
    sourceFormatVersion: 2,
    version: CURRENT_LAYOUT_VERSION,
    name,
    buttonMappings: [...buttonMappings],
    stickMappings: [...stickMappings],
  };
}
