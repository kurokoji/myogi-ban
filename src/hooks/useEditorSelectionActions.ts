import {
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
  useCallback,
  useMemo,
} from "react";
import { resetButtonToDefaults } from "../button-settings";
import {
  addEditorButton,
  deleteEditorButtons,
  distributeEditorButtons,
  duplicateEditorButtons,
  reorderEditorButtons,
} from "../editor-buttons";
import { deleteEditorSelection } from "../editor-keyboard";
import {
  createButtonSelection,
  type EditorSelection,
  EMPTY_EDITOR_SELECTION,
} from "../editor-selection";
import type { ButtonMapping } from "../gamepad";
import type { Layout } from "../types";

type SelectionTarget = { buttonIndexes: number[]; stick: boolean };

interface UseEditorSelectionActionsOptions {
  layoutRef: MutableRefObject<Layout>;
  buttonMappings: ButtonMapping[];
  selection: EditorSelection;
  setButtonMappings: (mappings: ButtonMapping[]) => void;
  setSelection: Dispatch<SetStateAction<EditorSelection>>;
  updateLayout: (updater: (next: Layout) => void) => void;
  cancelAssignment: () => void;
}

export interface EditorSelectionActions {
  addButton: () => void;
  deleteSelectedButtons: () => void;
  deleteSelection: (target: SelectionTarget) => boolean;
  duplicateSelection: (target: SelectionTarget) => void;
  resetSelectionToDefault: (target: SelectionTarget) => void;
  resetSelectionRotation: (target: SelectionTarget) => void;
  reorderSelection: (target: SelectionTarget, edge: "front" | "back") => void;
  distributeSelection: (
    target: SelectionTarget,
    direction: "horizontal" | "vertical",
  ) => void;
}

export function useEditorSelectionActions({
  layoutRef,
  buttonMappings,
  selection,
  setButtonMappings,
  setSelection,
  updateLayout,
  cancelAssignment,
}: UseEditorSelectionActionsOptions): EditorSelectionActions {
  const selectionButtonIndexes = selection.buttonIndexes;

  const deleteSelection = useCallback(
    (target: SelectionTarget) => {
      const deleted = deleteEditorSelection(
        layoutRef.current,
        buttonMappings,
        {
          ...target,
          primaryButtonIndex: target.buttonIndexes[0] ?? null,
        },
        "Delete",
      );
      if (!deleted) return false;
      updateLayout((next) => Object.assign(next, deleted.layout));
      setButtonMappings(deleted.mapping);
      setSelection(EMPTY_EDITOR_SELECTION);
      cancelAssignment();
      return true;
    },
    [
      buttonMappings,
      cancelAssignment,
      layoutRef,
      setButtonMappings,
      setSelection,
      updateLayout,
    ],
  );

  const duplicateSelection = useCallback(
    (target: SelectionTarget) => {
      const duplicated = duplicateEditorButtons(
        layoutRef.current,
        buttonMappings,
        target.buttonIndexes,
      );
      if (!duplicated) return;
      updateLayout((next) => Object.assign(next, duplicated.layout));
      setButtonMappings(duplicated.mapping);
      setSelection({
        buttonIndexes: duplicated.indexes,
        primaryButtonIndex: duplicated.indexes[0] ?? null,
        stick: false,
      });
      cancelAssignment();
    },
    [
      buttonMappings,
      cancelAssignment,
      layoutRef,
      setButtonMappings,
      setSelection,
      updateLayout,
    ],
  );

  const resetSelectionToDefault = useCallback(
    (target: SelectionTarget) => {
      updateLayout((next) => {
        for (const index of target.buttonIndexes) {
          const button = next.buttons[index];
          if (button) {
            next.buttons[index] = resetButtonToDefaults(
              button,
              next.defaultbuttons,
            );
          }
        }
      });
    },
    [updateLayout],
  );

  const resetSelectionRotation = useCallback(
    (target: SelectionTarget) => {
      updateLayout((next) => {
        for (const index of target.buttonIndexes) {
          if (next.buttons[index]) next.buttons[index].rotation = "0";
        }
      });
    },
    [updateLayout],
  );

  const reorderSelection = useCallback(
    (target: SelectionTarget, edge: "front" | "back") => {
      const reordered = reorderEditorButtons(
        layoutRef.current,
        buttonMappings,
        target.buttonIndexes,
        edge,
      );
      updateLayout((next) => Object.assign(next, reordered.layout));
      setButtonMappings(reordered.mapping);
      setSelection({
        buttonIndexes: reordered.indexes,
        primaryButtonIndex: reordered.indexes[0] ?? null,
        stick: false,
      });
      cancelAssignment();
    },
    [
      buttonMappings,
      cancelAssignment,
      layoutRef,
      setButtonMappings,
      setSelection,
      updateLayout,
    ],
  );

  const distributeSelection = useCallback(
    (target: SelectionTarget, direction: "horizontal" | "vertical") => {
      const distributed = distributeEditorButtons(
        layoutRef.current,
        target.buttonIndexes,
        direction,
      );
      if (!distributed) return;
      updateLayout((next) => Object.assign(next, distributed));
      cancelAssignment();
    },
    [cancelAssignment, layoutRef, updateLayout],
  );

  const addButton = useCallback(() => {
    const result = addEditorButton(layoutRef.current, buttonMappings);
    if (!result) return;
    updateLayout((next) => Object.assign(next, result.layout));
    setButtonMappings(result.mapping);
    setSelection(createButtonSelection(result.index));
    cancelAssignment();
  }, [
    buttonMappings,
    cancelAssignment,
    layoutRef,
    setButtonMappings,
    setSelection,
    updateLayout,
  ]);

  const deleteSelectedButtons = useCallback(() => {
    const layout = layoutRef.current;
    const result = deleteEditorButtons(
      layout,
      buttonMappings,
      selectionButtonIndexes,
    );
    if (result.layout.totalbuttonshow === layout.totalbuttonshow) return;
    updateLayout((next) => Object.assign(next, result.layout));
    setButtonMappings(result.mapping);
    setSelection(EMPTY_EDITOR_SELECTION);
    cancelAssignment();
  }, [
    buttonMappings,
    cancelAssignment,
    layoutRef,
    selectionButtonIndexes,
    setButtonMappings,
    setSelection,
    updateLayout,
  ]);

  return useMemo(
    () => ({
      addButton,
      deleteSelectedButtons,
      deleteSelection,
      duplicateSelection,
      resetSelectionToDefault,
      resetSelectionRotation,
      reorderSelection,
      distributeSelection,
    }),
    [
      addButton,
      deleteSelectedButtons,
      deleteSelection,
      duplicateSelection,
      resetSelectionToDefault,
      resetSelectionRotation,
      reorderSelection,
      distributeSelection,
    ],
  );
}
