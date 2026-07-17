import type { ButtonMapping, StickMapping } from "./gamepad";
import type { Layout } from "./types";

export function createLayoutSnapshotSignature(
  layout: Layout,
  buttonMappings?: ButtonMapping[],
  stickMappings?: StickMapping[],
): string {
  return buttonMappings && stickMappings
    ? JSON.stringify({ layout, buttonMappings, stickMappings })
    : JSON.stringify(layout);
}
