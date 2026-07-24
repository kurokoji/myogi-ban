import { deleteEditorButtons } from "./editor-buttons";
import { cloneLayout } from "./editor-helpers";
import type { EditorSelection } from "./editor-selection";
import type { ButtonMapping } from "./gamepad";
import type { Layout } from "./types";

export type EditorShortcut =
  | "clearSelection"
  | "delete"
  | "duplicate"
  | "resetRotation"
  | "save"
  | "selectAll"
  | "undo"
  | "redo";

export function editorShortcutHint(
  shortcut:
    | "clearSelection"
    | "delete"
    | "duplicate"
    | "move"
    | "redo"
    | "resetRotation"
    | "save"
    | "selectAll"
    | "undo"
    | "zoom",
  platform = globalThis.navigator?.platform ?? "",
): string {
  const modifier = platform.toLowerCase().includes("mac") ? "Cmd" : "Ctrl";
  return {
    clearSelection: "Escape",
    delete: "Delete",
    duplicate: `${modifier}+D`,
    move: "Arrow keys",
    redo: `${modifier}+Shift+Z`,
    resetRotation: "R",
    save: `${modifier}+S`,
    selectAll: `${modifier}+A`,
    undo: `${modifier}+Z`,
    zoom: `${modifier}+Wheel`,
  }[shortcut];
}

export function editorShortcutFromKey(event: {
  key: string;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
}): EditorShortcut | null {
  const key = event.key.toLowerCase();
  const commandModifier = event.ctrlKey || event.metaKey;
  if (commandModifier) {
    if (event.altKey) return null;
    if (key === "z") return event.shiftKey ? "redo" : "undo";
    if (key === "s") return "save";
    if (key === "a") return "selectAll";
    if (key === "d") return "duplicate";
    return null;
  }
  if (key === "escape") return "clearSelection";
  if (key === "delete") return "delete";
  return key === "r" ? "resetRotation" : null;
}

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
