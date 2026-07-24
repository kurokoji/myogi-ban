import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ButtonPositionUpdate } from "../editor-buttons";
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
  unionRectsAtIndexes,
} from "../geometry";
import type { Layout } from "../types";
import { EditorContextMenu } from "./editor/EditorContextMenu";
import { ButtonLayer } from "./gamepad/ButtonLayer";
import { GamepadBackgroundLayer } from "./gamepad/GamepadBackgroundLayer";
import { SelectionOverlays } from "./gamepad/SelectionOverlays";
import { StickLayer } from "./gamepad/StickLayer";

const STICK_SELECTION_SIZE = 96;
const SELECTION_BOUNDS_PADDING = 12;
const SNAP_THRESHOLD = 6;

export interface GamepadViewProps {
  layout: Layout;
  stickClass: string;
  pressedButtons: boolean[];
  backgroundOpacity?: number;
  editorMode?: boolean;
  selectedButtonIndex?: number | null;
  selectedButtonIndexes?: number[];
  selectedStick?: boolean;
  snappingEnabled?: boolean;
  aspectRatioLocked?: boolean;
  selectionSurfaceRef?: React.RefObject<HTMLElement | null>;
  onBackgroundSizeChange?: (width: number, height: number) => void;
  onButtonClick?: (index: number, toggleSelection: boolean) => void;
  onStickClick?: (index: number, toggleSelection: boolean) => void;
  onSelectionChange?: (selection: {
    buttonIndexes: number[];
    stick: boolean;
  }) => void;
  onLayoutDragStart?: () => void;
  onLayoutDragEnd?: () => void;
  onPositionsChange?: (update: {
    buttons: ButtonPositionUpdate[];
    stick?: { x: number; y: number };
  }) => void;
  onSizeChange?: (change: {
    type: "button" | "stick";
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }) => void;
  onRotationChange?: (change: { index: number; rotation: number }) => void;
  onDeleteSelection?: (selection: {
    buttonIndexes: number[];
    stick: boolean;
  }) => void;
}

type DragState =
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

function assetUrl(layout: Layout, fileName: string): string {
  return `layout/${layout.name}/${fileName}`;
}

function rectContainsPoint(rect: Rect, point: { x: number; y: number }) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
}

function normalizedRect(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
): Rect {
  return {
    left: Math.min(startX, endX),
    top: Math.min(startY, endY),
    right: Math.max(startX, endX),
    bottom: Math.max(startY, endY),
  };
}

function unionRects(rects: Rect[]): Rect | null {
  if (rects.length === 0) return null;
  return rects.reduce(
    (current, rect) => ({
      left: Math.min(current.left, rect.left),
      top: Math.min(current.top, rect.top),
      right: Math.max(current.right, rect.right),
      bottom: Math.max(current.bottom, rect.bottom),
    }),
    rects[0],
  );
}

function pointerToLocal(
  event: { clientX: number; clientY: number },
  element: HTMLElement,
  size: { width: number; height: number },
): { x: number; y: number } {
  const rect = element.getBoundingClientRect();
  const scaleX = rect.width ? size.width / rect.width : 1;
  const scaleY = rect.height ? size.height / rect.height : 1;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY,
  };
}

function useBackgroundSize(
  layout: Layout,
  onChange?: (width: number, height: number) => void,
): { width: number; height: number } {
  const [naturalSize, setNaturalSize] = useState<{
    key: string;
    width: number;
    height: number;
  } | null>(null);
  const imageUrl = layout.background.image
    ? assetUrl(layout, layout.background.image)
    : "";

  useEffect(() => {
    if (!imageUrl) {
      setNaturalSize(null);
      return;
    }
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (!cancelled) {
        setNaturalSize({
          key: imageUrl,
          width: image.naturalWidth,
          height: image.naturalHeight,
        });
      }
    };
    image.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const size = useMemo(() => {
    const naturalWidth =
      naturalSize?.key === imageUrl ? naturalSize.width : undefined;
    const naturalHeight =
      naturalSize?.key === imageUrl ? naturalSize.height : undefined;
    const legacyWidth = layout.background.w
      ? parseFloat(layout.background.w)
      : 500;
    const legacyHeight = layout.background.h
      ? parseFloat(layout.background.h)
      : 250;
    const explicitScale =
      layout.background.scale !== undefined && layout.background.scale !== "";
    const scale = explicitScale
      ? Math.max(0.1, parseFloat(layout.background.scale) || 1)
      : naturalWidth && layout.background.w
        ? Math.max(0.1, parseFloat(layout.background.w) / naturalWidth)
        : naturalHeight && layout.background.h
          ? Math.max(0.1, parseFloat(layout.background.h) / naturalHeight)
          : 1;

    return {
      width: Math.round((naturalWidth || legacyWidth) * scale),
      height: Math.round((naturalHeight || legacyHeight) * scale),
    };
  }, [
    imageUrl,
    layout.background.h,
    layout.background.scale,
    layout.background.w,
    naturalSize,
  ]);

  useEffect(() => {
    onChange?.(size.width, size.height);
  }, [onChange, size.height, size.width]);

  return size;
}

export function GamepadView(props: GamepadViewProps): React.ReactElement {
  const {
    layout,
    stickClass,
    pressedButtons,
    backgroundOpacity = 1,
    editorMode = false,
    selectedButtonIndex,
    selectedButtonIndexes = [],
    selectedStick = false,
    snappingEnabled = true,
    aspectRatioLocked = true,
    selectionSurfaceRef,
    onBackgroundSizeChange,
    onButtonClick,
    onStickClick,
    onSelectionChange,
    onLayoutDragStart,
    onLayoutDragEnd,
    onPositionsChange,
    onSizeChange,
    onRotationChange,
    onDeleteSelection,
  } = props;
  const backgroundSize = useBackgroundSize(layout, onBackgroundSizeChange);
  const defaultButton = layout.defaultbuttons;
  const stickScaleX = layout.stick.w ? parseFloat(layout.stick.w) / 100 : 1;
  const stickScaleY = layout.stick.h ? parseFloat(layout.stick.h) / 100 : 1;

  const selectedButtonSet = useMemo(
    () => new Set(selectedButtonIndexes),
    [selectedButtonIndexes],
  );
  const dragMovedRef = useRef(false);
  const areaRef = useRef<HTMLDivElement | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [snapGuides, setSnapGuides] = useState<{
    x?: number;
    y?: number;
    targets: Rect[];
  } | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    selection: { buttonIndexes: number[]; stick: boolean };
  } | null>(null);

  const buttonRects = useMemo(
    () =>
      Array.from({ length: layout.totalbuttonshow }, (_, index) => {
        const button = layout.buttons[index] || defaultButton;
        const width = parseFloat(button.w || defaultButton.w || "60") || 60;
        const height = parseFloat(button.h || defaultButton.h || "60") || 60;
        const centerX = parseFloat(button.x || defaultButton.x || "0") || 0;
        const centerY = parseFloat(button.y || defaultButton.y || "0") || 0;
        const left = centerX - width / 2;
        const top = centerY - height / 2;
        return {
          index,
          left,
          top,
          right: left + width,
          bottom: top + height,
        };
      }),
    [defaultButton, layout.buttons, layout.totalbuttonshow],
  );

  const stickRect = useMemo(() => {
    const centerX = parseFloat(layout.stick.x) || 110;
    const centerY = parseFloat(layout.stick.y) || 125;
    const width = STICK_SELECTION_SIZE * stickScaleX;
    const height = STICK_SELECTION_SIZE * stickScaleY;
    return {
      left: centerX - width / 2,
      top: centerY - height / 2,
      right: centerX + width / 2,
      bottom: centerY + height / 2,
    };
  }, [layout.stick.x, layout.stick.y, stickScaleX, stickScaleY]);

  const selectionRect =
    dragState?.type === "selection"
      ? normalizedRect(
          dragState.startX,
          dragState.startY,
          dragState.currentX,
          dragState.currentY,
        )
      : null;
  const selectedButtonsRect = unionRectsAtIndexes(
    buttonRects,
    selectedButtonIndexes,
  );
  const selectedGroupRect =
    editorMode && !selectionRect
      ? unionRects([
          ...(selectedButtonsRect ? [selectedButtonsRect] : []),
          ...(selectedStick && layout.showstick ? [stickRect] : []),
        ])
      : null;
  const resizableSelection =
    selectedButtonIndexes.length + (selectedStick ? 1 : 0) === 1;
  const rotatableSelection =
    selectedButtonIndexes.length === 1 && !selectedStick;
  const selectedButtonRotation = rotatableSelection
    ? Number.parseFloat(
        layout.buttons[selectedButtonIndexes[0]]?.rotation ??
          defaultButton.rotation ??
          "0",
      ) || 0
    : 0;

  const createGroupDragState = useCallback(
    (local: { x: number; y: number }): DragState => {
      const buttons = Array.from(selectedButtonSet, (selectedIndex) => {
        const button = layout.buttons[selectedIndex] || defaultButton;
        return {
          index: selectedIndex,
          initialX: parseFloat(button.x || defaultButton.x || "0"),
          initialY: parseFloat(button.y || defaultButton.y || "0"),
        };
      });
      const stick = selectedStick
        ? {
            initialX: parseFloat(layout.stick.x) || 110,
            initialY: parseFloat(layout.stick.y) || 125,
          }
        : null;
      return {
        type: "group",
        startX: local.x,
        startY: local.y,
        buttons,
        stick,
        snapRect: selectedGroupRect ?? stickRect,
        snapTargets: buttonRects.filter(
          (button) => !selectedButtonSet.has(button.index),
        ),
      };
    },
    [
      defaultButton,
      layout.buttons,
      layout.stick.x,
      layout.stick.y,
      buttonRects,
      selectedButtonSet,
      selectedGroupRect,
      selectedStick,
      stickRect,
    ],
  );

  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      type: "button" | "stick",
      index: number,
      initialX: number,
      initialY: number,
    ) => {
      if (!editorMode) return;
      e.stopPropagation();
      const area = areaRef.current;
      if (!area) return;
      const local = pointerToLocal(e, area, backgroundSize);
      dragMovedRef.current = false;
      setSnapGuides(null);
      onLayoutDragStart?.();

      if (
        (type === "button" && selectedButtonSet.has(index)) ||
        (type === "stick" && selectedStick)
      ) {
        setDragState(createGroupDragState(local));
        return;
      }

      setDragState({
        type,
        index,
        startX: local.x,
        startY: local.y,
        initialX,
        initialY,
        snapRect: type === "button" ? buttonRects[index] : stickRect,
        snapTargets:
          type === "button"
            ? buttonRects.filter((button) => button.index !== index)
            : buttonRects,
      });
    },
    [
      backgroundSize,
      buttonRects,
      createGroupDragState,
      editorMode,
      onLayoutDragStart,
      selectedButtonSet,
      selectedStick,
      stickRect,
    ],
  );

  const handleGroupBoundsMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!editorMode || event.button !== 0) return;
      event.stopPropagation();
      const area = areaRef.current;
      if (!area) return;
      const local = pointerToLocal(event, area, backgroundSize);
      dragMovedRef.current = false;
      setSnapGuides(null);
      onLayoutDragStart?.();
      setDragState(createGroupDragState(local));
    },
    [backgroundSize, createGroupDragState, editorMode, onLayoutDragStart],
  );

  const handleGroupBoundsClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!editorMode || (!event.ctrlKey && !event.metaKey)) return;
      event.stopPropagation();
      if (dragMovedRef.current) {
        dragMovedRef.current = false;
        return;
      }
      const area = areaRef.current;
      if (!area) return;
      const local = pointerToLocal(event, area, backgroundSize);
      const button = [...buttonRects]
        .reverse()
        .find((rect) => rectContainsPoint(rect, local));
      if (button) {
        onButtonClick?.(button.index, true);
      } else if (layout.showstick && rectContainsPoint(stickRect, local)) {
        onStickClick?.(0, true);
      }
    },
    [
      backgroundSize,
      buttonRects,
      editorMode,
      layout.showstick,
      onButtonClick,
      onStickClick,
      stickRect,
    ],
  );

  const handleResizeMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>, corner: RectCorner) => {
      if (!editorMode || event.button !== 0 || !resizableSelection) return;
      event.stopPropagation();
      const area = areaRef.current;
      if (!area) return;
      const local = pointerToLocal(event, area, backgroundSize);
      const buttonIndex = selectedButtonIndexes[0];
      dragMovedRef.current = false;
      setSnapGuides(null);
      onLayoutDragStart?.();
      setDragState({
        type: "resize",
        target: buttonIndex === undefined ? "stick" : "button",
        index: buttonIndex ?? 0,
        corner,
        startX: local.x,
        startY: local.y,
        initialRect:
          buttonIndex === undefined ? stickRect : buttonRects[buttonIndex],
        rotation: buttonIndex === undefined ? 0 : selectedButtonRotation,
      });
    },
    [
      backgroundSize,
      buttonRects,
      editorMode,
      onLayoutDragStart,
      resizableSelection,
      selectedButtonIndexes,
      selectedButtonRotation,
      stickRect,
    ],
  );

  const handleRotateMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!editorMode || event.button !== 0 || !rotatableSelection) return;
      event.stopPropagation();
      const area = areaRef.current;
      const index = selectedButtonIndexes[0];
      const rect = buttonRects[index];
      if (!area || !rect) return;
      const button = layout.buttons[index] || defaultButton;
      dragMovedRef.current = false;
      setSnapGuides(null);
      onLayoutDragStart?.();
      setDragState({
        type: "rotate",
        index,
        center: {
          x: (rect.left + rect.right) / 2,
          y: (rect.top + rect.bottom) / 2,
        },
        start: pointerToLocal(event, area, backgroundSize),
        initialRotation: Number.parseFloat(
          button.rotation ?? defaultButton.rotation ?? "0",
        ),
      });
    },
    [
      backgroundSize,
      buttonRects,
      defaultButton,
      editorMode,
      layout.buttons,
      onLayoutDragStart,
      rotatableSelection,
      selectedButtonIndexes,
    ],
  );

  const handleSelectionMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!editorMode || event.button !== 0) return;
      const target = event.target;
      const canStartSelection =
        event.currentTarget === target ||
        (target instanceof HTMLElement &&
          target.id === "gamepad-area-background");
      if (!canStartSelection) return;
      const local = pointerToLocal(event, event.currentTarget, backgroundSize);
      dragMovedRef.current = false;
      setDragState({
        type: "selection",
        startX: local.x,
        startY: local.y,
        currentX: local.x,
        currentY: local.y,
      });
    },
    [backgroundSize, editorMode],
  );

  const handleSelectionClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!editorMode || dragMovedRef.current) return;
      const target = event.target;
      const canClearSelection =
        event.currentTarget === target ||
        (target instanceof HTMLElement &&
          target.id === "gamepad-area-background");
      if (!canClearSelection) return;
      onSelectionChange?.({ buttonIndexes: [], stick: false });
    },
    [editorMode, onSelectionChange],
  );

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
  }, [backgroundSize, editorMode, selectionSurfaceRef]);

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
      );
      const snappedDelta = snap.delta;
      setSnapGuides(
        snap.guideX === undefined && snap.guideY === undefined
          ? null
          : {
              x: snap.guideX,
              y: snap.guideY,
              targets: rectsOnSnapGuides(
                dragState.snapTargets,
                snap.guideX,
                snap.guideY,
              ),
            },
      );

      if (dragState.type === "group") {
        onPositionsChange?.({
          buttons: dragGroupPositions(
            dragState.buttons,
            { x: dragState.startX, y: dragState.startY },
            {
              x: dragState.startX + snappedDelta.x,
              y: dragState.startY + snappedDelta.y,
            },
          ),
          stick: dragState.stick
            ? {
                x: Math.round(dragState.stick.initialX + snappedDelta.x),
                y: Math.round(dragState.stick.initialY + snappedDelta.y),
              }
            : undefined,
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
    };

    const handleMouseUp = () => {
      setSnapGuides(null);
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
          stick: layout.showstick && rectsIntersect(selectedRect, stickRect),
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
    backgroundSize,
    buttonRects,
    layout.showstick,
    onPositionsChange,
    onSizeChange,
    onRotationChange,
    onLayoutDragEnd,
    onSelectionChange,
    snappingEnabled,
    stickRect,
  ]);

  const handleButtonClick = useCallback(
    (index: number, event: React.MouseEvent) => {
      if (dragMovedRef.current) {
        dragMovedRef.current = false;
        return;
      }
      onButtonClick?.(index, event.ctrlKey || event.metaKey);
    },
    [onButtonClick],
  );

  const openContextMenu = useCallback(
    (
      event: React.MouseEvent,
      target?: { type: "button"; index: number } | { type: "stick" },
    ) => {
      if (!editorMode) return;
      event.preventDefault();
      event.stopPropagation();
      let nextSelection = {
        buttonIndexes: selectedButtonIndexes,
        stick: selectedStick,
      };
      if (target?.type === "button" && !selectedButtonSet.has(target.index)) {
        nextSelection = { buttonIndexes: [target.index], stick: false };
        onSelectionChange?.(nextSelection);
      } else if (target?.type === "stick" && !selectedStick) {
        nextSelection = { buttonIndexes: [], stick: true };
        onSelectionChange?.(nextSelection);
      }
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        selection: nextSelection,
      });
    },
    [
      editorMode,
      onSelectionChange,
      selectedButtonIndexes,
      selectedButtonSet,
      selectedStick,
    ],
  );

  const handleStickClick = useCallback(
    (index: number, event: React.MouseEvent) => {
      if (dragMovedRef.current) {
        dragMovedRef.current = false;
        return;
      }
      onStickClick?.(index, event.ctrlKey || event.metaKey);
    },
    [onStickClick],
  );

  return (
    <div id="gamepad0" className="gamepad-background">
      <div
        ref={areaRef}
        id="gamepad-area"
        className="gamepad-area"
        style={{ width: backgroundSize.width, height: backgroundSize.height }}
        onMouseDown={handleSelectionMouseDown}
        onClick={handleSelectionClick}
      >
        <GamepadBackgroundLayer
          background={layout.background}
          layoutName={layout.name}
          width={backgroundSize.width}
          height={backgroundSize.height}
          opacity={backgroundOpacity}
        />
        <StickLayer
          stick={layout.stick}
          show={layout.showstick}
          stickClass={stickClass}
          scaleX={stickScaleX}
          scaleY={stickScaleY}
          editorMode={editorMode}
          selected={selectedStick}
          onDragMouseDown={(event, initialX, initialY) =>
            handleMouseDown(event, "stick", 0, initialX, initialY)
          }
          onDirectionClick={handleStickClick}
          onContextMenu={(event) => openContextMenu(event, { type: "stick" })}
        />
        <ButtonLayer
          layout={layout}
          pressedButtons={pressedButtons}
          editorMode={editorMode}
          selectedButtonIndex={selectedButtonIndex}
          selectedButtonIndexes={selectedButtonIndexes}
          onButtonClick={handleButtonClick}
          onButtonMouseDown={(event, index, initialX, initialY) =>
            handleMouseDown(event, "button", index, initialX, initialY)
          }
          onButtonContextMenu={(index, event) =>
            openContextMenu(event, { type: "button", index })
          }
        />
        <SelectionOverlays
          selectionRect={selectionRect}
          selectedGroupRect={selectedGroupRect}
          snapGuides={snapGuides}
          snapTargets={snapGuides?.targets}
          boundsPadding={SELECTION_BOUNDS_PADDING}
          resizable={resizableSelection}
          rotatable={rotatableSelection}
          rotation={selectedButtonRotation}
          onBoundsMouseDown={handleGroupBoundsMouseDown}
          onBoundsClick={handleGroupBoundsClick}
          onBoundsContextMenu={openContextMenu}
          onResizeMouseDown={handleResizeMouseDown}
          onRotateMouseDown={handleRotateMouseDown}
        />
        {contextMenu && (
          <EditorContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onDelete={() => onDeleteSelection?.(contextMenu.selection)}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  );
}
