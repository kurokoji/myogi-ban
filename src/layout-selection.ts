import type { LayoutEntry } from "./types";

export function selectLayoutAfterDelete(
  layouts: LayoutEntry[],
  deletedId: string,
): LayoutEntry | undefined {
  return (
    layouts.find((entry) => entry.id === deletedId && entry.builtin) ??
    layouts[0]
  );
}
