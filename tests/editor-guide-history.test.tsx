// biome-ignore-all assist/source/organizeImports: DOM setup must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import "./component-render";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { useRef, useState } from "react";
import { useEditorGuides } from "../src/hooks/useEditorGuides";
import { useLayoutHistory } from "../src/hooks/useLayoutHistory";
import { createDefaultLayout } from "../src/layout";
import type { Layout } from "../src/types";

function useGuideHistory(
  initialLayout = createDefaultLayout(),
  onDragCoordinateChange?: (
    coordinate: { x: number; y: number; label: string } | null,
  ) => void,
) {
  const [layout, setLayout] = useState<Layout>(() => initialLayout);
  const layoutRef = useRef(layout);
  const history = useLayoutHistory({
    layout,
    layoutRef,
    setLayout,
    onRestore: () => {},
  });
  const guides = useEditorGuides({
    layoutRef,
    previewScale: 1,
    setLayout,
    onDragStart: history.beginDrag,
    onDragEnd: history.endDrag,
    onDragCoordinateChange,
  });

  return { layout, ...history, ...guides };
}

function guideMouseEvent(clientX: number, clientY: number) {
  return {
    clientX,
    clientY,
    preventDefault() {},
    stopPropagation() {},
  } as React.MouseEvent<HTMLElement>;
}

function attachPreview(previewRef: React.RefObject<HTMLElement | null>) {
  const preview = document.createElement("div");
  preview.getBoundingClientRect = () => ({ left: 0, top: 0 }) as DOMRect;
  previewRef.current = preview;
}

test("adding a guide can be undone as one history entry", () => {
  const { result } = renderHook(useGuideHistory);
  attachPreview(result.current.previewRef);

  act(() => result.current.startGuideDrag("x", guideMouseEvent(40, 0)));
  act(() =>
    window.dispatchEvent(new window.MouseEvent("mouseup", { clientX: 50 })),
  );

  assert.deepEqual(result.current.layout.guides.vertical, [50]);
  assert.equal(result.current.historyAvailability.canUndo, true);

  act(() => result.current.undoLayout());

  assert.deepEqual(result.current.layout.guides.vertical, []);
});

test("moving an existing guide can be undone as one history entry", () => {
  const layout = createDefaultLayout();
  layout.guides.vertical = [20];
  const { result } = renderHook(() => useGuideHistory(layout));
  attachPreview(result.current.previewRef);

  act(() =>
    result.current.startExistingGuideDrag("x", 0, guideMouseEvent(20, 0)),
  );
  act(() =>
    window.dispatchEvent(new window.MouseEvent("mousemove", { clientX: 30 })),
  );
  act(() =>
    window.dispatchEvent(new window.MouseEvent("mouseup", { clientX: 40 })),
  );

  assert.deepEqual(result.current.layout.guides.vertical, [40]);
  assert.equal(result.current.historyAvailability.canUndo, true);

  act(() => result.current.undoLayout());

  assert.deepEqual(result.current.layout.guides.vertical, [20]);
  assert.equal(result.current.historyAvailability.canUndo, false);
});

test("dragging an existing guide reports its live coordinate and clears it on release", () => {
  const layout = createDefaultLayout();
  layout.guides.vertical = [20];
  const coordinates: Array<{ x: number; y: number; label: string } | null> = [];
  const { result } = renderHook(() =>
    useGuideHistory(layout, (coordinate) => coordinates.push(coordinate)),
  );
  attachPreview(result.current.previewRef);

  act(() =>
    result.current.startExistingGuideDrag("x", 0, guideMouseEvent(20, 0)),
  );
  act(() =>
    window.dispatchEvent(new window.MouseEvent("mousemove", { clientX: 30 })),
  );
  act(() =>
    window.dispatchEvent(new window.MouseEvent("mouseup", { clientX: 40 })),
  );

  assert.deepEqual(coordinates.at(-2), { x: 30, y: 0, label: "X: 30" });
  assert.equal(coordinates.at(-1), null);
});

test("removing a guide by dragging it outside can be undone", () => {
  const layout = createDefaultLayout();
  layout.guides.vertical = [20];
  const { result } = renderHook(() => useGuideHistory(layout));
  attachPreview(result.current.previewRef);

  act(() =>
    result.current.startExistingGuideDrag("x", 0, guideMouseEvent(20, 0)),
  );
  act(() =>
    window.dispatchEvent(new window.MouseEvent("mouseup", { clientX: -1 })),
  );

  assert.deepEqual(result.current.layout.guides.vertical, []);

  act(() => result.current.undoLayout());

  assert.deepEqual(result.current.layout.guides.vertical, [20]);
});
