export function toggleSelectedIndex(
  selectedIndexes: number[],
  index: number,
): number[] {
  return selectedIndexes.includes(index)
    ? selectedIndexes.filter((selectedIndex) => selectedIndex !== index)
    : [...selectedIndexes, index];
}
