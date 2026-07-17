import type { LayoutEntry } from "./types";

export function selectDefaultLayoutEntry(
  entries: LayoutEntry[],
  requestedName: string,
): LayoutEntry | undefined {
  return (
    entries.find((entry) => entry.name === requestedName && !entry.builtin) ??
    entries.find((entry) => entry.name === requestedName) ??
    entries.find((entry) => entry.name === "default" && entry.builtin) ??
    entries[0]
  );
}
