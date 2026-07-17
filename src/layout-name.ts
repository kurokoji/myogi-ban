import type { LayoutEntry } from "./types";

export function normalizeLayoutName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export function isLayoutNameTaken(
  name: string,
  layouts: LayoutEntry[],
): boolean {
  const normalizedName = normalizeLayoutName(name);
  if (!normalizedName) return false;
  return layouts.some(
    (entry) => normalizeLayoutName(entry.name) === normalizedName,
  );
}
