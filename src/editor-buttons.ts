import { MAX_VISIBLE_BUTTONS } from "./app-constants";
import { cloneLayout, createEmptyButtonLayout } from "./editor-helpers";
import { type ButtonMapping, UNASSIGNED_MAPPING } from "./gamepad";
import type { Layout } from "./types";

export interface ButtonPositionUpdate {
  index: number;
  x: number;
  y: number;
}

export function withButtonPositions(
  layout: Layout,
  positions: ButtonPositionUpdate[],
): Layout {
  const next = cloneLayout(layout);
  for (const { index, x, y } of positions) {
    if (!next.buttons[index]) {
      next.buttons[index] = createEmptyButtonLayout();
    }
    next.buttons[index].x = String(x);
    next.buttons[index].y = String(y);
  }
  return next;
}

export function addEditorButton(
  layout: Layout,
  mapping: ButtonMapping[],
  limit = MAX_VISIBLE_BUTTONS,
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

export function duplicateEditorButtons(
  layout: Layout,
  mapping: ButtonMapping[],
  selected: number[],
  limit = MAX_VISIBLE_BUTTONS,
) {
  const indexesToCopy = [...new Set(selected)]
    .filter((index) => index >= 0 && index < layout.totalbuttonshow)
    .slice(0, Math.max(0, limit - layout.totalbuttonshow));
  if (indexesToCopy.length === 0) return null;
  const next = cloneLayout(layout);
  const nextMapping = [...mapping];
  const indexes: number[] = [];
  for (const sourceIndex of indexesToCopy) {
    const source = layout.buttons[sourceIndex];
    const index = next.totalbuttonshow;
    next.buttons.splice(index, 0, {
      ...source,
      x: String((Number.parseFloat(source.x) || 0) + 16),
      y: String((Number.parseFloat(source.y) || 0) + 16),
    });
    nextMapping.splice(index, 0, UNASSIGNED_MAPPING);
    next.totalbuttonshow += 1;
    indexes.push(index);
  }
  next.buttons.splice(limit);
  nextMapping.splice(limit);
  return { layout: next, mapping: nextMapping, indexes };
}

export function reorderEditorButtons(
  layout: Layout,
  mapping: ButtonMapping[],
  selected: number[],
  edge: "front" | "back",
) {
  const selectedSet = new Set(
    selected.filter((index) => index >= 0 && index < layout.totalbuttonshow),
  );
  const visibleIndexes = Array.from(
    { length: layout.totalbuttonshow },
    (_, index) => index,
  );
  const selectedIndexes = visibleIndexes.filter((index) =>
    selectedSet.has(index),
  );
  const unselectedIndexes = visibleIndexes.filter(
    (index) => !selectedSet.has(index),
  );
  const order =
    edge === "front"
      ? [...unselectedIndexes, ...selectedIndexes]
      : [...selectedIndexes, ...unselectedIndexes];
  const next = cloneLayout(layout);
  const nextMapping = [...mapping];
  const visibleButtons = order.map((index) => next.buttons[index]);
  const visibleMappings = order.map(
    (index) => mapping[index] ?? UNASSIGNED_MAPPING,
  );
  next.buttons.splice(0, order.length, ...visibleButtons);
  nextMapping.splice(0, order.length, ...visibleMappings);
  const firstSelectedIndex = edge === "front" ? unselectedIndexes.length : 0;
  return {
    layout: next,
    mapping: nextMapping,
    indexes: selectedIndexes.map((_, offset) => firstSelectedIndex + offset),
  };
}
