import { cloneLayout, createEmptyButtonLayout } from "./editor-helpers";
import { type ButtonMapping, UNASSIGNED_MAPPING } from "./gamepad";
import type { Layout } from "./types";

export function addEditorButton(
  layout: Layout,
  mapping: ButtonMapping[],
  limit = 48,
) {
  if (layout.totalbuttonshow >= limit) return null;
  const next = cloneLayout(layout);
  const nextMapping = [...mapping];
  const index = next.totalbuttonshow;
  next.buttons.splice(index, 0, createEmptyButtonLayout());
  next.buttons.splice(limit);
  nextMapping.splice(index, 0, UNASSIGNED_MAPPING);
  nextMapping.splice(limit);
  next.totalbuttonshow += 1;
  return { layout: next, mapping: nextMapping, index };
}

export function deleteEditorButtons(
  layout: Layout,
  mapping: ButtonMapping[],
  selected: number[],
) {
  const next = cloneLayout(layout);
  const nextMapping = [...mapping];
  const indexes = [...new Set(selected)]
    .filter((i) => i >= 0 && i < next.totalbuttonshow)
    .sort((a, b) => b - a);
  for (const index of indexes) {
    next.buttons.splice(index, 1);
    next.buttons.push(createEmptyButtonLayout());
    nextMapping.splice(index, 1);
    nextMapping.push(UNASSIGNED_MAPPING);
  }
  next.totalbuttonshow -= indexes.length;
  return { layout: next, mapping: nextMapping };
}
