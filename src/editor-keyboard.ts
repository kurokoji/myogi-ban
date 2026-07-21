import { deleteEditorButtons } from "./editor-buttons";
import { cloneLayout } from "./editor-helpers";
import type { EditorSelection } from "./editor-selection";
import type { ButtonMapping } from "./gamepad";
import type { Layout } from "./types";

export function deleteEditorSelection(
  layout: Layout,
  buttonMappings: ButtonMapping[],
  selection: EditorSelection,
  key: string,
): { layout: Layout; mapping: ButtonMapping[] } | null {
  if (
    key !== "Delete" ||
    (selection.buttonIndexes.length === 0 && !selection.stick)
  )
    return null;
  const result = deleteEditorButtons(
    layout,
    buttonMappings,
    selection.buttonIndexes,
  );
  if (selection.stick) result.layout.showstick = false;
  return result;
}

export function editorNudgeHistoryMode(repeat: boolean): "record" | "continue" {
  return repeat ? "continue" : "record";
}

export function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  if (!target || !("closest" in target)) return false;
  const element = target as EventTarget & {
    closest: (selector: string) => unknown;
  };
  return Boolean(
    element.closest("input, textarea, select, [contenteditable='true']"),
  );
}

export function nudgeEditorSelection(
  layout: Layout,
  selection: EditorSelection,
  key: string,
): Layout | null {
  const delta = {
    ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
  }[key];
  if (!delta || (selection.buttonIndexes.length === 0 && !selection.stick))
    return null;

  const next = cloneLayout(layout);
  for (const index of selection.buttonIndexes) {
    next.buttons[index].x = String(Number(next.buttons[index].x) + delta.x);
    next.buttons[index].y = String(Number(next.buttons[index].y) + delta.y);
  }
  if (selection.stick) {
    next.stick.x = String(Number(next.stick.x) + delta.x);
    next.stick.y = String(Number(next.stick.y) + delta.y);
  }
  return next;
}
