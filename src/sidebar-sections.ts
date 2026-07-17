export const SIDEBAR_SECTIONS_STORAGE_KEY = "editor-sidebar-sections";

interface ReadableStorage {
  getItem(key: string): string | null;
}

interface WritableStorage {
  setItem(key: string, value: string): void;
}

export function readOpenSidebarSections(
  storage: ReadableStorage,
  fallback: string[],
): string[] {
  const stored = storage.getItem(SIDEBAR_SECTIONS_STORAGE_KEY);
  if (stored === null) return fallback;
  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) &&
      parsed.every((value) => typeof value === "string")
      ? parsed
      : fallback;
  } catch {
    return fallback;
  }
}

export function writeOpenSidebarSections(
  storage: WritableStorage,
  sections: string[],
): void {
  storage.setItem(SIDEBAR_SECTIONS_STORAGE_KEY, JSON.stringify(sections));
}
