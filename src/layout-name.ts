import type { LayoutEntry } from "./types";

export function normalizeLayoutName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

export function isValidLayoutName(name: string): boolean {
  const trimmedName = name.trim();
  const hasInvalidCharacter = [...trimmedName].some((character) => {
    const code = character.charCodeAt(0);
    return (
      character === "/" || character === "\\" || code <= 31 || code === 127
    );
  });
  return (
    trimmedName.length > 0 &&
    trimmedName !== "." &&
    trimmedName !== ".." &&
    !hasInvalidCharacter
  );
}

export class InvalidLayoutNameError extends Error {
  constructor(name: string) {
    super(`Invalid layout name: ${JSON.stringify(name)}`);
    this.name = "InvalidLayoutNameError";
  }
}

export function assertValidLayoutName(name: string): void {
  if (!isValidLayoutName(name)) throw new InvalidLayoutNameError(name);
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

export function resolveAvailableLayoutName(
  requestedName: string,
  layouts: LayoutEntry[],
): string {
  if (!isLayoutNameTaken(requestedName, layouts)) return requestedName;
  let suffix = 2;
  while (isLayoutNameTaken(`${requestedName}-${suffix}`, layouts)) suffix += 1;
  return `${requestedName}-${suffix}`;
}
