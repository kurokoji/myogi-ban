import { cloneLayout } from "./editor-helpers";
import type { ButtonMapping, StickMapping } from "./gamepad";
import { CURRENT_LAYOUT_VERSION } from "./layout-migration";
import type { Layout } from "./types";

export function buildLayoutForSave(
  layout: Layout,
  name: string,
  buttonMappings: ButtonMapping[],
  stickMappings: StickMapping[],
): Layout {
  const saved = cloneLayout(layout);
  return {
    ...saved,
    version: CURRENT_LAYOUT_VERSION,
    name,
    buttonMappings: [...buttonMappings],
    stickMappings: [...stickMappings],
  };
}
