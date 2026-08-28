import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useEffect,
} from "react";
import {
  decideEditorKeyboardAction,
  editorNudgeHistoryMode,
  editorShortcutFromKey,
  isEditableKeyboardTarget,
  nudgeEditorSelection,
} from "../editor-keyboard";
import {
  type EditorSelection,
  EMPTY_EDITOR_SELECTION,
} from "../editor-selection";
import type { Layout } from "../types";

type SelectionTarget = { buttonIndexes: number[]; stick: boolean };

interface UseEditorKeyboardShortcutsOptions {
  layoutRef: MutableRefObject<Layout>;
  selection: EditorSelection;
  currentBuiltin: boolean;
  setLayout: Dispatch<SetStateAction<Layout>>;
  setSelection: Dispatch<SetStateAction<EditorSelection>>;
  cancelAssignment: () => void;
  saveLayout: () => void;
  undoLayout: () => void;
  redoLayout: () => void;
  updateLayout: (updater: (next: Layout) => void) => void;
  deleteSelection: (target: SelectionTarget) => boolean;
  duplicateSelection: (target: SelectionTarget) => void;
  resetSelectionRotation: (target: SelectionTarget) => void;
}

export function useEditorKeyboardShortcuts({
  layoutRef,
  selection,
  currentBuiltin,
  setLayout,
  setSelection,
  cancelAssignment,
  saveLayout,
  undoLayout,
  redoLayout,
  updateLayout,
  deleteSelection,
  duplicateSelection,
  resetSelectionRotation,
}: UseEditorKeyboardShortcutsOptions): void {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const decision = decideEditorKeyboardAction({
        isEditableTarget: isEditableKeyboardTarget(event.target),
        shortcut: editorShortcutFromKey(event),
        repeat: event.repeat,
        selectionEmpty:
          selection.buttonIndexes.length === 0 && !selection.stick,
        hasSelectedButtons: selection.buttonIndexes.length > 0,
        currentBuiltin,
      });

      if (decision.preventDefault) event.preventDefault();

      switch (decision.action) {
        case "none":
          return;
        case "save":
          saveLayout();
          return;
        case "clearSelection":
          setSelection(EMPTY_EDITOR_SELECTION);
          cancelAssignment();
          return;
        case "selectAll": {
          const buttonIndexes = Array.from(
            { length: layoutRef.current.totalbuttonshow },
            (_, index) => index,
          );
          setSelection({
            buttonIndexes,
            primaryButtonIndex: buttonIndexes[0] ?? null,
            stick: false,
          });
          cancelAssignment();
          return;
        }
        case "undo":
          undoLayout();
          return;
        case "redo":
          redoLayout();
          return;
        case "delete":
          if (deleteSelection(selection)) event.preventDefault();
          return;
        case "duplicate":
          duplicateSelection(selection);
          return;
        case "resetRotation":
          resetSelectionRotation(selection);
          return;
        case "nudge": {
          const moved = nudgeEditorSelection(
            layoutRef.current,
            selection,
            event.key,
          );
          if (!moved) return;
          event.preventDefault();
          if (editorNudgeHistoryMode(event.repeat) === "record") {
            updateLayout((next) => Object.assign(next, moved));
            return;
          }
          setLayout(moved);
          layoutRef.current = moved;
          return;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    cancelAssignment,
    currentBuiltin,
    deleteSelection,
    duplicateSelection,
    layoutRef,
    redoLayout,
    resetSelectionRotation,
    saveLayout,
    selection,
    setLayout,
    setSelection,
    undoLayout,
    updateLayout,
  ]);
}
