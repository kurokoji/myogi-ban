import type { LayoutEntry } from "./types";

export function selectLayoutAfterDelete(
  layouts: LayoutEntry[],
  deletedName: string,
): LayoutEntry | undefined {
  return (
    layouts.find((entry) => entry.name === deletedName && entry.builtin) ??
    layouts[0]
  );
}
