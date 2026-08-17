import type { LayoutEntry } from "./types";

export function selectDefaultLayoutEntry(
  entries: LayoutEntry[],
  requestedId: string,
): LayoutEntry | undefined {
  return (
    entries.find((entry) => entry.id === requestedId && !entry.builtin) ??
    entries.find((entry) => entry.id === requestedId) ??
    entries.find((entry) => entry.id === "default" && entry.builtin) ??
    entries[0]
  );
}
