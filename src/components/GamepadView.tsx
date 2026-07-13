import type React from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ButtonShape, type Layout, STICK_NAMES } from "../types";

const STICK_SELECTION_SIZE = 96;
const SELECTION_BOUNDS_PADDING = 12;

function buttonRadiusForShape(shape: ButtonShape): string {
  switch (shape) {
    case "square":
      return "0";
    case "rounded":
      return "8px";
    case "circle":
      return "50%";
  }
}

export interface GamepadViewProps {
  layout: Layout;
  stickClass: string;
  pressedButtons: boolean[];
  backgroundOpacity?: number;
  editorMode?: boolean;
  selectedButtonIndex?: number | null;
  selectedButtonIndexes?: number[];
  selectedStick?: boolean;
  onBackgroundSizeChange?: (width: number, height: number) => void;
  onButtonClick?: (index: number) => void;
  onStickClick?: (index: number) => void;
  onSelectionChange?: (selection: {
    buttonIndexes: number[];
    stick: boolean;
  }) => void;
  onLayoutDragStart?: () => void;
  onLayoutDragEnd?: () => void;
  onButtonPositionChange?: (index: number, x: number, y: number) => void;
  onStickPositionChange?: (x: number, y: number) => void;
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

type DragState =
  | {
      type: "button" | "stick";
      index: number;
      startX: number;
      startY: number;
      initialX: number;
      initialY: number;
    }
  | {
      type: "group";
      startX: number;
      startY: number;
      buttons: Array<{ index: number; initialX: number; initialY: number }>;
      stick: { initialX: number; initialY: number } | null;
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

function getImageStyle(layout: Layout, fileName: string): React.CSSProperties {
  return fileName
    ? { backgroundImage: `url("${assetUrl(layout, fileName)}")` }
    : {};
}

function rectsIntersect(a: Rect, b: Rect): boolean {
  return (
    a.left <= b.right &&
    a.right >= b.left &&
    a.top <= b.bottom &&
    a.bottom >= b.top
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
    onBackgroundSizeChange,
    onButtonClick,
    onStickClick,
    onSelectionChange,
    onLayoutDragStart,
    onLayoutDragEnd,
    onButtonPositionChange,
    onStickPositionChange,
  } = props;
  const backgroundSize = useBackgroundSize(layout, onBackgroundSizeChange);
  const defaultButton = layout.defaultbuttons;
  const stickScaleX = layout.stick.w ? parseFloat(layout.stick.w) / 100 : 1;
  const stickScaleY = layout.stick.h ? parseFloat(layout.stick.h) / 100 : 1;

  const stickCss = layout.stick.useCss ?? false;

  const selectedButtonSet = useMemo(
    () => new Set(selectedButtonIndexes),
    [selectedButtonIndexes],
  );
  const dragMovedRef = useRef(false);
  const [dragState, setDragState] = useState<DragState | null>(null);

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
  const selectedGroupRect =
    editorMode && !selectionRect
      ? unionRects([
          ...buttonRects.filter((button) =>
            selectedButtonSet.has(button.index),
          ),
          ...(selectedStick && layout.showstick ? [stickRect] : []),
        ])
      : null;

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
      };
    },
    [
      defaultButton,
      layout.buttons,
      layout.stick.x,
      layout.stick.y,
      selectedButtonSet,
      selectedStick,
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
      const area = document.getElementById("gamepad-area");
      if (!area) return;
      const local = pointerToLocal(e, area, backgroundSize);
      dragMovedRef.current = false;
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
      });
    },
    [
      backgroundSize,
      createGroupDragState,
      editorMode,
      onLayoutDragStart,
      selectedButtonSet,
      selectedStick,
    ],
  );

  const handleGroupBoundsMouseDown = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!editorMode || event.button !== 0) return;
      event.stopPropagation();
      const area = document.getElementById("gamepad-area");
      if (!area) return;
      const local = pointerToLocal(event, area, backgroundSize);
      dragMovedRef.current = false;
      onLayoutDragStart?.();
      setDragState(createGroupDragState(local));
    },
    [backgroundSize, createGroupDragState, editorMode, onLayoutDragStart],
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
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (dragState.type === "selection") {
        const area = document.getElementById("gamepad-area");
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

      const area = document.getElementById("gamepad-area");
      if (!area) return;
      const local = pointerToLocal(e, area, backgroundSize);
      const deltaX = local.x - dragState.startX;
      const deltaY = local.y - dragState.startY;
      if (Math.abs(deltaX) > 2 || Math.abs(deltaY) > 2) {
        dragMovedRef.current = true;
      }

      if (dragState.type === "group") {
        for (const button of dragState.buttons) {
          onButtonPositionChange?.(
            button.index,
            Math.round(button.initialX + deltaX),
            Math.round(button.initialY + deltaY),
          );
        }
        if (dragState.stick) {
          onStickPositionChange?.(
            Math.round(dragState.stick.initialX + deltaX),
            Math.round(dragState.stick.initialY + deltaY),
          );
        }
        return;
      }

      const newX = Math.round(dragState.initialX + deltaX);
      const newY = Math.round(dragState.initialY + deltaY);

      if (dragState.type === "button") {
        onButtonPositionChange?.(dragState.index, newX, newY);
      } else if (dragState.type === "stick") {
        onStickPositionChange?.(newX, newY);
      }
    };

    const handleMouseUp = () => {
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
    backgroundSize,
    buttonRects,
    layout.showstick,
    onButtonPositionChange,
    onLayoutDragEnd,
    onSelectionChange,
    onStickPositionChange,
    stickRect,
  ]);

  const handleButtonClick = useCallback(
    (index: number) => {
      if (dragMovedRef.current) {
        dragMovedRef.current = false;
        return;
      }
      onButtonClick?.(index);
    },
    [onButtonClick],
  );

  const handleStickClick = useCallback(
    (index: number) => {
      if (dragMovedRef.current) {
        dragMovedRef.current = false;
        return;
      }
      onStickClick?.(index);
    },
    [onStickClick],
  );

  return (
    <div id="gamepad0" className="gamepad-background">
      <div
        id="gamepad-area"
        className="gamepad-area"
        style={{ width: backgroundSize.width, height: backgroundSize.height }}
        onMouseDown={handleSelectionMouseDown}
        onClick={handleSelectionClick}
      >
        <div
          id="gamepad-area-background"
          className={`gamepad-area-background${layout.background.useCss ? " background-css" : ""}`}
          style={{
            ...(layout.background.useCss
              ? ({
                  "--bg-color": layout.background.cssColor ?? "#0b0f14",
                  "--bg-radius": `${layout.background.cssBorderRadius ?? 0}px`,
                } as React.CSSProperties)
              : getImageStyle(layout, layout.background.image)),
            width: backgroundSize.width,
            height: backgroundSize.height,
            opacity: backgroundOpacity,
            visibility: layout.background.show === false ? "hidden" : "visible",
          }}
        />
        <div
          id="stick-area"
          className={`stick-area ${stickCss ? "stick-css" : ""} ${editorMode && selectedStick ? "stick-selected" : ""}`}
          style={{
            left: layout.stick.x ? `${layout.stick.x}px` : undefined,
            top: layout.stick.y ? `${layout.stick.y}px` : undefined,
            transform: `translate(-50%,-50%) scale(${stickScaleX},${stickScaleY})`,
            display: layout.showstick ? undefined : "none",
            cursor: editorMode ? "move" : undefined,
            ...(stickCss
              ? ({
                  "--stick-color": layout.stick.cssColor ?? "#cccccc",
                  "--stick-plate-color":
                    layout.stick.cssPlateColor ?? "#888888",
                  "--stick-transition": `${layout.stick.cssTransition ?? "0.02"}s`,
                  "--stick-easing": layout.stick.cssEasing ?? "ease",
                } as React.CSSProperties)
              : {}),
          }}
        >
          {editorMode && (
            <div
              className="stick-drag-handle"
              onMouseDown={(e) =>
                handleMouseDown(
                  e,
                  "stick",
                  0,
                  parseFloat(layout.stick.x) || 110,
                  parseFloat(layout.stick.y) || 125,
                )
              }
            />
          )}
          {stickCss &&
            (() => {
              const dir = stickClass.startsWith("stick ")
                ? stickClass.slice(6)
                : "";
              return (
                <div
                  id="stick-shaft"
                  className={`stick-shaft${dir ? ` ${dir}` : ""}`}
                />
              );
            })()}
          <div
            id="stick"
            className={stickCss ? `${stickClass} stick-css` : stickClass}
          />
          {STICK_NAMES.map((name, index) => (
            <div
              id={name}
              className={`stick-block ${name}`}
              key={name}
              onClick={editorMode ? () => handleStickClick(index) : undefined}
            />
          ))}
        </div>
        <div id="button-area" className="button-area">
          {Array.from({ length: layout.totalbuttonshow }, (_, index) => {
            const button = layout.buttons[index] || defaultButton;
            const pressed = pressedButtons[index] || false;
            const releasedImage =
              button.img === defaultButton.img ? "" : button.img;
            const pressedImage =
              button.imgp === defaultButton.imgp ? "" : button.imgp;
            const releasedWidth = button.w === defaultButton.w ? "" : button.w;
            const releasedHeight = button.h === defaultButton.h ? "" : button.h;
            const pressedWidth =
              button.wp === defaultButton.wp ? "" : button.wp;
            const pressedHeight =
              button.hp === defaultButton.hp ? "" : button.hp;

            const useCss = button.useCss ?? defaultButton.useCss ?? false;
            const useImage = pressed ? pressedImage : releasedImage;
            const cssColor =
              button.cssColor ?? defaultButton.cssColor ?? "#cccccc";
            const cssPressedColor =
              button.cssPressedColor ??
              defaultButton.cssPressedColor ??
              "#999999";
            const cssTransition =
              button.cssTransition ?? defaultButton.cssTransition ?? "0.02";
            const cssEasing =
              button.cssEasing ?? defaultButton.cssEasing ?? "ease";
            const cssShape =
              button.cssShape ?? defaultButton.cssShape ?? "circle";
            const rotation = button.rotation ?? defaultButton.rotation ?? "0";
            const style: React.CSSProperties = {
              left: `${button.x || defaultButton.x || 0}px`,
              top: `${button.y || defaultButton.y || 0}px`,
              width: `${pressed ? pressedWidth || defaultButton.wp || defaultButton.w || "60" : releasedWidth || defaultButton.w || "60"}px`,
              height: `${pressed ? pressedHeight || defaultButton.hp || defaultButton.h || "60" : releasedHeight || defaultButton.h || "60"}px`,
              cursor: editorMode ? "move" : undefined,
              "--button-color": pressed ? cssPressedColor : cssColor,
              "--button-shadow-color": pressed
                ? "rgba(0, 0, 0, 0.4)"
                : "rgba(0, 0, 0, 0.2)",
              "--button-rotation": `${rotation}deg`,
              "--button-radius": buttonRadiusForShape(cssShape),
              "--button-transition": `${cssTransition}s`,
              "--button-easing": cssEasing,
            } as React.CSSProperties;

            if (!useCss && useImage) {
              style.backgroundImage = `url("${assetUrl(layout, useImage)}")`;
            }

            if (pressed) {
              if (button.xp || defaultButton.xp)
                style.left = `${button.xp || defaultButton.xp}px`;
              if (button.yp || defaultButton.yp)
                style.top = `${button.yp || defaultButton.yp}px`;
            }

            const className = `gamepad-button button${index} ${pressed ? "button-pressed" : "button-released"} ${useCss ? "button-css" : ""} ${editorMode && ((selectedButtonIndex !== null && selectedButtonIndex !== undefined && selectedButtonIndex === index) || selectedButtonSet.has(index)) ? "button-selected" : ""}`;

            return (
              <div
                id={`button${index}`}
                className={className}
                key={index}
                onClick={
                  editorMode ? () => handleButtonClick(index) : undefined
                }
                onMouseDown={
                  editorMode
                    ? (e) =>
                        handleMouseDown(
                          e,
                          "button",
                          index,
                          parseFloat(button.x || defaultButton.x || "0"),
                          parseFloat(button.y || defaultButton.y || "0"),
                        )
                    : undefined
                }
                style={style}
              />
            );
          })}
        </div>
        {selectionRect && (
          <div
            className="selection-box"
            style={{
              left: selectionRect.left,
              top: selectionRect.top,
              width: selectionRect.right - selectionRect.left,
              height: selectionRect.bottom - selectionRect.top,
            }}
          />
        )}
        {selectedGroupRect && (
          <div
            className="selection-bounds"
            onMouseDown={handleGroupBoundsMouseDown}
            style={{
              left: selectedGroupRect.left - SELECTION_BOUNDS_PADDING,
              top: selectedGroupRect.top - SELECTION_BOUNDS_PADDING,
              width:
                selectedGroupRect.right -
                selectedGroupRect.left +
                SELECTION_BOUNDS_PADDING * 2,
              height:
                selectedGroupRect.bottom -
                selectedGroupRect.top +
                SELECTION_BOUNDS_PADDING * 2,
            }}
          />
        )}
      </div>
    </div>
  );
}
