import { cloneLayout } from "./editor-helpers";
import type { Layout } from "./types";

export interface EditorResizeChange {
  type: "button" | "stick";
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function applyEditorResize(
  layout: Layout,
  change: EditorResizeChange,
): Layout {
  const next = cloneLayout(layout);
  if (change.type === "button") {
    const button = next.buttons[change.index];
    if (!button) return layout;
    button.x = String(change.x);
    button.y = String(change.y);
    button.w = String(change.width);
    button.h = String(change.height);
  } else {
    next.stick.x = String(change.x);
    next.stick.y = String(change.y);
    next.stick.w = String(Math.round((change.width / 96) * 100));
    next.stick.h = String(Math.round((change.height / 96) * 100));
  }
  return next;
}

export function applyEditorRotation(
  layout: Layout,
  change: { index: number; rotation: number },
): Layout {
  const button = layout.buttons[change.index];
  if (!button) return layout;
  const next = cloneLayout(layout);
  next.buttons[change.index].rotation = String(change.rotation);
  return next;
}
