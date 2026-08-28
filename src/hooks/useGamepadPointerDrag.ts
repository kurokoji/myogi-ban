import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
} from "react";
import {
  normalizedRect,
  pointerToLocal,
} from "../components/gamepad/pointer-geometry";
import type { ButtonPositionUpdate } from "../editor-buttons";
import {
  formatDragCoordinateLabel,
  formatDragDeltaLabel,
} from "../editor-helpers";
import {
  dragGroupPositions,
  dragPosition,
  dragRotation,
  type Rect,
  type RectCorner,
  rectsIntersect,
  rectsOnSnapGuides,
  resizeRotatedRectFromCorner,
  resolveRectSnap,
  visibleSnapGuide,
} from "../geometry";
import type { Layout } from "../types";

const SNAP_THRESHOLD = 6;

export type DragState =
  | {
      type: "rotate";
      index: number;
      center: { x: number; y: number };
      start: { x: number; y: number };
      initialRotation: number;
    }
  | {
      type: "resize";
      target: "button" | "stick";
      index: number;
      corner: RectCorner;
      startX: number;
      startY: number;
      initialRect: Rect;
      rotation: number;
    }
  | {
      type: "button" | "stick";
      index: number;
      startX: number;
      startY: number;
      initialX: number;
      initialY: number;
      snapRect: Rect;
      snapTargets: Rect[];
    }
  | {
      type: "group";
      startX: number;
      startY: number;
      buttons: Array<{ index: number; initialX: number; initialY: number }>;
      stick: { initialX: number; initialY: number } | null;
      snapRect: Rect;
      snapTargets: Rect[];
    }
  | {
      type: "selection";
      startX: number;
      startY: number;
      currentX: number;
      currentY: number;
    };

export interface SnapGuides {
  x?: number;
  y?: number;
  targets: Rect[];
}

type ButtonRect = Rect & { index: number };

interface DragCoordinate {
  x: number;
  y: number;
  label: string;
}

interface UseGamepadPointerDragOptions {
  editorMode: boolean;
  areaRef: RefObject<HTMLDivElement | null>;
  selectionSurfaceRef?: RefObject<HTMLElement | null>;
  backgroundSize: { width: number; height: number };
  aspectRatioLocked: boolean;
  snappingEnabled: boolean;
  guides: Layout["guides"];
  showstick: boolean;
  buttonRects: ButtonRect[];
  stickRect: Rect;
  onPositionsChange?: (update: {
    buttons: ButtonPositionUpdate[];
    stick?: { x: number; y: number };
  }) => void;
  onDragCoordinateChange?: (coordinate: DragCoordinate | null) => void;
  onSizeChange?: (change: {
    type: "button" | "stick";
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  onRotationChange?: (change: { index: number; rotation: number }) => void;
  onLayoutDragEnd?: () => void;
  onSelectionChange?: (selection: {
    buttonIndexes: number[];
    stick: boolean;
  }) => void;
  dragState: DragState | null;
  setDragState: Dispatch<SetStateAction<DragState | null>>;
  dragMovedRef: RefObject<boolean>;
  setSnapGuides: Dispatch<SetStateAction<SnapGuides | null>>;
}

export function useGamepadPointerDrag({
  editorMode,
  areaRef,
  selectionSurfaceRef,
  backgroundSize,
  aspectRatioLocked,
  snappingEnabled,
  guides,
  showstick,
  buttonRects,
  stickRect,
  onPositionsChange,
  onDragCoordinateChange,
  onSizeChange,
  onRotationChange,
  onLayoutDragEnd,
  onSelectionChange,
  dragState,
  setDragState,
  dragMovedRef,
  setSnapGuides,
}: UseGamepadPointerDragOptions): void {
  useEffect(() => {
    const surface = selectionSurfaceRef?.current;
    if (!editorMode || !surface) return;

    const handleExternalMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (
        target.closest(
          "#gamepad-area, .preview-ruler, .preview-guide, .preview-toolbar, .preview-history-toolbar",
        )
      )
        return;
      const area = areaRef.current;
      if (!area) return;
      const local = pointerToLocal(event, area, backgroundSize);
      dragMovedRef.current = false;
      setDragState({
        type: "selection",
        startX: local.x,
        startY: local.y,
        currentX: local.x,
        currentY: local.y,
      });
    };

    const handleExternalClick = (event: MouseEvent) => {
      if (!dragMovedRef.current) return;
      dragMovedRef.current = false;
      event.stopPropagation();
    };

    surface.addEventListener("mousedown", handleExternalMouseDown);
    surface.addEventListener("click", handleExternalClick);
    return () => {
      surface.removeEventListener("mousedown", handleExternalMouseDown);
      surface.removeEventListener("click", handleExternalClick);
    };
  }, [
    areaRef,
    backgroundSize,
    dragMovedRef,
    editorMode,
    selectionSurfaceRef,
    setDragState,
  ]);

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.type === "selection") {
        setSnapGuides(null);
        const area = areaRef.current;
        if (!area) return;
        const local = pointerToLocal(e, area, backgroundSize);
        if (
          Math.abs(local.x - dragState.startX) > 2 ||
          Math.abs(local.y - dragState.startY) > 2
        ) {
          dragMovedRef.current = true;
        }
        setDragState((current) =>
          current?.type === "selection"
            ? { ...current, currentX: local.x, currentY: local.y }
            : current,
        );
        return;
      }

      if (dragState.type === "resize") {
        const area = areaRef.current;
        if (!area) return;
        const local = pointerToLocal(e, area, backgroundSize);
        const resized = resizeRotatedRectFromCorner(
          dragState.initialRect,
          dragState.corner,
          {
            x: local.x - dragState.startX,
            y: local.y - dragState.startY,
          },
          12,
          dragState.rotation,
          aspectRatioLocked,
        );
        dragMovedRef.current = true;
        onSizeChange?.({
          type: dragState.target,
          index: dragState.index,
          x: Math.round(resized.x),
          y: Math.round(resized.y),
          width: Math.round(resized.width),
          height: Math.round(resized.height),
        });
        return;
      }

      if (dragState.type === "rotate") {
        const area = areaRef.current;
        if (!area) return;
        dragMovedRef.current = true;
        onRotationChange?.({
          index: dragState.index,
          rotation: dragRotation(
            dragState.initialRotation,
            dragState.center,
            dragState.start,
            pointerToLocal(e, area, backgroundSize),
          ),
        });
        return;
      }

      const area = areaRef.current;
      if (!area) return;
      const local = pointerToLocal(e, area, backgroundSize);
      const deltaX = local.x - dragState.startX;
      const deltaY = local.y - dragState.startY;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        dragMovedRef.current = true;
      }
      const snap = resolveRectSnap(
        snappingEnabled,
        dragState.snapRect,
        { x: deltaX, y: deltaY },
        dragState.snapTargets,
        SNAP_THRESHOLD,
        guides,
      );
      const snappedDelta = snap.delta;
      setSnapGuides(
        snap.guideX === undefined && snap.guideY === undefined
          ? null
          : {
              x: visibleSnapGuide(snap.guideX, guides.vertical),
              y: visibleSnapGuide(snap.guideY, guides.horizontal),
              targets: rectsOnSnapGuides(
                dragState.snapTargets,
                snap.guideX,
                snap.guideY,
              ),
            },
      );

      if (dragState.type === "group") {
        const groupButtons = dragGroupPositions(
          dragState.buttons,
          { x: dragState.startX, y: dragState.startY },
          {
            x: dragState.startX + snappedDelta.x,
            y: dragState.startY + snappedDelta.y,
          },
        );
        const groupStick = dragState.stick
          ? {
              x: Math.round(dragState.stick.initialX + snappedDelta.x),
              y: Math.round(dragState.stick.initialY + snappedDelta.y),
            }
          : undefined;
        onPositionsChange?.({ buttons: groupButtons, stick: groupStick });
        const singleItem =
          groupButtons.length + (groupStick ? 1 : 0) === 1
            ? (groupButtons[0] ?? groupStick)
            : undefined;
        onDragCoordinateChange?.({
          x: e.clientX,
          y: e.clientY,
          label: singleItem
            ? formatDragCoordinateLabel(singleItem.x, singleItem.y)
            : formatDragDeltaLabel(
                Math.round(snappedDelta.x),
                Math.round(snappedDelta.y),
              ),
        });
        return;
      }

      const position = dragPosition(
        { x: dragState.initialX, y: dragState.initialY },
        { x: 0, y: 0 },
        snappedDelta,
      );

      if (dragState.type === "button") {
        onPositionsChange?.({
          buttons: [{ index: dragState.index, ...position }],
        });
      } else if (dragState.type === "stick") {
        onPositionsChange?.({ buttons: [], stick: position });
      }
      onDragCoordinateChange?.({
        x: e.clientX,
        y: e.clientY,
        label: formatDragCoordinateLabel(position.x, position.y),
      });
    };

    const handleMouseUp = () => {
      setSnapGuides(null);
      onDragCoordinateChange?.(null);
      if (dragState.type === "selection") {
        const selectedRect = normalizedRect(
          dragState.startX,
          dragState.startY,
          dragState.currentX,
          dragState.currentY,
        );
        const isClickSelection =
          Math.abs(dragState.currentX - dragState.startX) < 3 &&
          Math.abs(dragState.currentY - dragState.startY) < 3;
        if (isClickSelection) {
          onSelectionChange?.({ buttonIndexes: [], stick: false });
          setDragState(null);
          return;
        }
        const buttonIndexes = buttonRects
          .filter((button) => rectsIntersect(selectedRect, button))
          .map((button) => button.index);
        onSelectionChange?.({
          buttonIndexes,
          stick: showstick && rectsIntersect(selectedRect, stickRect),
        });
        setDragState(null);
        return;
      }
      setDragState(null);
      onLayoutDragEnd?.();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [
    dragState,
    aspectRatioLocked,
    areaRef,
    backgroundSize,
    buttonRects,
    dragMovedRef,
    guides,
    showstick,
    onPositionsChange,
    onDragCoordinateChange,
    onSizeChange,
    onRotationChange,
    onLayoutDragEnd,
    onSelectionChange,
    setDragState,
    setSnapGuides,
    snappingEnabled,
    stickRect,
  ]);
}
