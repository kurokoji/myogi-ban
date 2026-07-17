import { cloneLayout, type ImageUploadTarget } from "./editor-helpers";
import type { Layout } from "./types";

export function withUploadedImage(
  layout: Layout,
  target: ImageUploadTarget,
  layoutName: string,
  fileName: string,
): Layout {
  const updated = cloneLayout(layout);
  updated.name = layoutName;
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
