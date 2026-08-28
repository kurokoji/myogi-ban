import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAX_VISIBLE_BUTTONS } from "../app-constants";
import type { ButtonPositionUpdate } from "../editor-buttons";
import { type Rect, type RectCorner, unionRectsAtIndexes } from "../geometry";
import {
  type DragState,
  type SnapGuides,
  useGamepadPointerDrag,
} from "../hooks/useGamepadPointerDrag";
import { layoutAssetDirectory } from "../layout-image";
import type { Layout } from "../types";
import { EditorContextMenu } from "./editor/EditorContextMenu";
import { ButtonLayer } from "./gamepad/ButtonLayer";
import { GamepadBackgroundLayer } from "./gamepad/GamepadBackgroundLayer";
import { normalizedRect, pointerToLocal } from "./gamepad/pointer-geometry";
import { SelectionOverlays } from "./gamepad/SelectionOverlays";
import { StickDirectionZones } from "./gamepad/StickDirectionZones";
import { StickLayer } from "./gamepad/StickLayer";

const STICK_SELECTION_SIZE = 96;
const SELECTION_BOUNDS_PADDING = 12;

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
  onStickClick?: (index: number | null, toggleSelection: boolean) => void;
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
  onDragCoordinateChange?: (
    coordinate: { x: number; y: number; label: string } | null,
  ) => void;
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
  onDuplicateSelection?: (selection: {
    buttonIndexes: number[];
    stick: boolean;
  }) => void;
  onResetSelectionToDefault?: (selection: {
    buttonIndexes: number[];
    stick: boolean;
  }) => void;
  onResetSelectionRotation?: (selection: {
    buttonIndexes: number[];
    stick: boolean;
  }) => void;
  onReorderSelection?: (
    selection: { buttonIndexes: number[]; stick: boolean },
    edge: "front" | "back",
  ) => void;
  onDistributeSelection?: (
    selection: { buttonIndexes: number[]; stick: boolean },
    direction: "horizontal" | "vertical",
  ) => void;
}

function assetUrl(layout: Layout, fileName: string): string {
  return `layout/${layoutAssetDirectory(layout)}/${fileName}`;
}

function rectContainsPoint(rect: Rect, point: { x: number; y: number }) {
  return (
    point.x >= rect.left &&
    point.x <= rect.right &&
    point.y >= rect.top &&
    point.y <= rect.bottom
  );
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
    onDragCoordinateChange,
    onSizeChange,
    onRotationChange,
    onDeleteSelection,
    onDuplicateSelection,
    onResetSelectionToDefault,
    onResetSelectionRotation,
    onReorderSelection,
    onDistributeSelection,
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
  const [snapGuides, setSnapGuides] = useState<SnapGuides | null>(null);
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

  useGamepadPointerDrag({
    editorMode,
    areaRef,
    selectionSurfaceRef,
    backgroundSize,
    aspectRatioLocked,
    snappingEnabled,
    guides: layout.guides,
    showstick: layout.showstick,
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
  });

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
        onStickClick?.(null, true);
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
    (index: number | null, event: React.MouseEvent) => {
      if (dragMovedRef.current) {
        dragMovedRef.current = false;
        return;
      }
      onStickClick?.(index, event.ctrlKey || event.metaKey);
    },
    [onStickClick],
  );

  const handleStickCenterClick = useCallback(
    (event: React.MouseEvent) => handleStickClick(null, event),
    [handleStickClick],
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
          layoutId={layoutAssetDirectory(layout)}
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
          onDragMouseDown={(event, initialX, initialY) =>
            handleMouseDown(event, "stick", 0, initialX, initialY)
          }
          onCenterClick={handleStickCenterClick}
          onContextMenu={(event) => openContextMenu(event, { type: "stick" })}
        />
        {editorMode && selectedStick && layout.showstick && (
          <StickDirectionZones
            centerX={(stickRect.left + stickRect.right) / 2}
            centerY={(stickRect.top + stickRect.bottom) / 2}
            scaleX={stickScaleX}
            scaleY={stickScaleY}
            onDirectionClick={handleStickClick}
          />
        )}
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
            showButtonActions={contextMenu.selection.buttonIndexes.length > 0}
            showDistributionActions={
              contextMenu.selection.buttonIndexes.length >= 3
            }
            canDuplicate={layout.totalbuttonshow < MAX_VISIBLE_BUTTONS}
            onDuplicate={() => onDuplicateSelection?.(contextMenu.selection)}
            onResetToDefault={() =>
              onResetSelectionToDefault?.(contextMenu.selection)
            }
            onResetRotation={() =>
              onResetSelectionRotation?.(contextMenu.selection)
            }
            onBringToFront={() =>
              onReorderSelection?.(contextMenu.selection, "front")
            }
            onSendToBack={() =>
              onReorderSelection?.(contextMenu.selection, "back")
            }
            onDistributeHorizontally={() =>
              onDistributeSelection?.(contextMenu.selection, "horizontal")
            }
            onDistributeVertically={() =>
              onDistributeSelection?.(contextMenu.selection, "vertical")
            }
            onDelete={() => onDeleteSelection?.(contextMenu.selection)}
            onClose={() => setContextMenu(null)}
          />
        )}
      </div>
    </div>
  );
}
