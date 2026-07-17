export function toggleSelectedIndex(
  selectedIndexes: number[],
  index: number,
): number[] {
  return selectedIndexes.includes(index)
    ? selectedIndexes.filter((selectedIndex) => selectedIndex !== index)
    : [...selectedIndexes, index];
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
