import { createLayoutSnapshotSignature } from "./layout-snapshot";
import type { Layout } from "./types";

export function areLayoutSnapshotsEqual(a: Layout, b: Layout): boolean {
  return createLayoutSnapshotSignature(a) === createLayoutSnapshotSignature(b);
}
