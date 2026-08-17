const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * A layout's id names its directory and never changes, so it is generated
 * rather than derived from the name the user typed.
 */
export function createLayoutId(): string {
  return crypto.randomUUID();
}

/** Layouts created before ids were generated carry their old directory name. */
export function isGeneratedLayoutId(id: string): boolean {
  return UUID_PATTERN.test(id);
}
