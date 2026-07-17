import type { ButtonLayout } from "./types";

export function resetButtonToDefaults(
  button: ButtonLayout,
  defaults: ButtonLayout,
): ButtonLayout {
  return { ...defaults, x: button.x, y: button.y };
}
