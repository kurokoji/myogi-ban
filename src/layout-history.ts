import type { Layout } from "./types";

export function areLayoutSnapshotsEqual(a: Layout, b: Layout): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
