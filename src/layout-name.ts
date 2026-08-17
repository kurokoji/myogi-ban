/** Long enough for any reasonable name, short enough to stay displayable. */
const MAX_LAYOUT_NAME_LENGTH = 200;

export function normalizeLayoutName(name: string): string {
  return name.trim().toLocaleLowerCase();
}

function hasUndisplayableCharacter(value: string): boolean {
  return [...value].some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

/**
 * A name is shown, never resolved to a path, so it only has to be present and
 * printable. Slashes, dots, and duplicates are the user's business.
 */
export function isValidLayoutName(name: string): boolean {
  const trimmedName = name.trim();
  return (
    trimmedName.length > 0 &&
    trimmedName.length <= MAX_LAYOUT_NAME_LENGTH &&
    !hasUndisplayableCharacter(trimmedName)
  );
}

/** An id names a directory, so it must not reach outside the layout folder. */
export function isValidLayoutId(id: string): boolean {
  const trimmedId = id.trim();
  return (
    trimmedId.length > 0 &&
    trimmedId !== "." &&
    trimmedId !== ".." &&
    !trimmedId.includes("/") &&
    !trimmedId.includes("\\") &&
    !hasUndisplayableCharacter(trimmedId)
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

export function assertValidLayoutId(id: string): void {
  if (!isValidLayoutId(id)) throw new InvalidLayoutNameError(id);
}
