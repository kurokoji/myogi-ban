import { cloneLayout, type ImageUploadTarget } from "./editor-helpers";
import type { Layout } from "./types";

/** Assets live in the layout's directory, which the id names when present. */
export function layoutAssetDirectory(layout: Layout): string {
  return layout.id || layout.name;
}

export function withUploadedImage(
  layout: Layout,
  target: ImageUploadTarget,
  layoutId: string,
  fileName: string,
): Layout {
  const updated = cloneLayout(layout);
  // Assets live in the layout's directory, which the id names.
  updated.id = layoutId;
  if (target.type === "background") {
    updated.background.image = fileName;
  } else if (target.type === "defaultButton") {
    updated.defaultbuttons[target.state === "pressed" ? "imgp" : "img"] =
      fileName;
  } else {
    for (const index of target.indexes) {
      updated.buttons[index][target.state === "pressed" ? "imgp" : "img"] =
        fileName;
    }
  }
  return updated;
}
