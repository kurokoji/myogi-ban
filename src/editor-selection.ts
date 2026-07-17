export function toggleSelectedIndex(
  selectedIndexes: number[],
  index: number,
): number[] {
  return selectedIndexes.includes(index)
    ? selectedIndexes.filter((selectedIndex) => selectedIndex !== index)
    : [...selectedIndexes, index];
}

export interface EditorSelection {
  buttonIndexes: number[];
  primaryButtonIndex: number | null;
  stick: boolean;
}

export const EMPTY_EDITOR_SELECTION: EditorSelection = {
  buttonIndexes: [],
  primaryButtonIndex: null,
  stick: false,
};

export function createButtonSelection(index: number): EditorSelection {
  return { buttonIndexes: [index], primaryButtonIndex: index, stick: false };
}

export function toggleButtonInSelection(
  selection: EditorSelection,
  index: number,
): EditorSelection {
  const buttonIndexes = toggleSelectedIndex(selection.buttonIndexes, index);
  return {
    ...selection,
    buttonIndexes,
    primaryButtonIndex: buttonIndexes[0] ?? null,
  };
}

export function normalizeEditorSelection(
  buttonIndexes: number[],
  primaryIndex: number | null,
  total: number,
) {
  const filtered = buttonIndexes.filter((index) => index >= 0 && index < total);
  const indexes =
    filtered.length === buttonIndexes.length ? buttonIndexes : filtered;
  const invalidPrimary =
    primaryIndex !== null && (primaryIndex < 0 || primaryIndex >= total);
  return {
    buttonIndexes: indexes,
    primaryIndex: invalidPrimary ? null : primaryIndex,
    cancelAssignment: invalidPrimary,
  };
}
