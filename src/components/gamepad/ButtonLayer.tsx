import type React from "react";
import { type CSSVariableStyle, cssVariables } from "../../style-types";
import type { ButtonLayout, ButtonShape, Layout } from "../../types";

function buttonRadiusForShape(shape: ButtonShape): string {
  if (shape === "square") return "0";
  if (shape === "rounded") return "8px";
  if (shape === "pill") return "9999px";
  return "50%";
}

interface ButtonLayerProps {
  layout: Layout;
  pressedButtons: boolean[];
  editorMode: boolean;
  selectedButtonIndex: number | null | undefined;
  selectedButtonIndexes: number[];
  onButtonClick: (index: number, event: React.MouseEvent) => void;
  onButtonMouseDown: (
    event: React.MouseEvent,
    index: number,
    initialX: number,
    initialY: number,
  ) => void;
  onButtonContextMenu?: (index: number, event: React.MouseEvent) => void;
}

function buttonStyle(
  layout: Layout,
  button: ButtonLayout,
  defaultButton: ButtonLayout,
  pressed: boolean,
): React.CSSProperties {
  const releasedImage = button.img === defaultButton.img ? "" : button.img;
  const pressedImage = button.imgp === defaultButton.imgp ? "" : button.imgp;
  const releasedWidth = button.w === defaultButton.w ? "" : button.w;
  const releasedHeight = button.h === defaultButton.h ? "" : button.h;
  const pressedWidth = button.wp === defaultButton.wp ? "" : button.wp;
  const pressedHeight = button.hp === defaultButton.hp ? "" : button.hp;
  const useCss = button.useCss ?? defaultButton.useCss ?? false;
  const useImage = pressed ? pressedImage : releasedImage;
  const cssColor = button.cssColor ?? defaultButton.cssColor ?? "#cccccc";
  const cssPressedColor =
    button.cssPressedColor ?? defaultButton.cssPressedColor ?? "#999999";
  const cssTransition =
    button.cssTransition ?? defaultButton.cssTransition ?? "0.02";
  const cssEasing = button.cssEasing ?? defaultButton.cssEasing ?? "ease";
  const cssShape = button.cssShape ?? defaultButton.cssShape ?? "circle";
  const rotation = button.rotation ?? defaultButton.rotation ?? "0";
  const style: CSSVariableStyle = cssVariables({
    left: `${button.x || defaultButton.x || 0}px`,
    top: `${button.y || defaultButton.y || 0}px`,
    width: `${pressed ? pressedWidth || defaultButton.wp || defaultButton.w || "60" : releasedWidth || defaultButton.w || "60"}px`,
    height: `${pressed ? pressedHeight || defaultButton.hp || defaultButton.h || "60" : releasedHeight || defaultButton.h || "60"}px`,
    "--button-color": pressed ? cssPressedColor : cssColor,
    "--button-shadow-color": pressed
      ? "rgba(0, 0, 0, 0.4)"
      : "rgba(0, 0, 0, 0.2)",
    "--button-rotation": `${rotation}deg`,
    "--button-radius": buttonRadiusForShape(cssShape),
    "--button-transition": `${cssTransition}s`,
    "--button-easing": cssEasing,
  });
  if (!useCss && useImage) {
    style.backgroundImage = `url("layout/${layout.name}/${useImage}")`;
  }
  if (pressed) {
    if (button.xp || defaultButton.xp)
      style.left = `${button.xp || defaultButton.xp}px`;
    if (button.yp || defaultButton.yp)
      style.top = `${button.yp || defaultButton.yp}px`;
  }
  return style;
}

export function ButtonLayer({
  layout,
  pressedButtons,
  editorMode,
  selectedButtonIndex,
  selectedButtonIndexes,
  onButtonClick,
  onButtonMouseDown,
  onButtonContextMenu,
}: ButtonLayerProps): React.ReactElement {
  const defaultButton = layout.defaultbuttons;
  const selected = new Set(selectedButtonIndexes);
  return (
    <div id="button-area" className="button-area">
      {Array.from({ length: layout.totalbuttonshow }, (_, index) => {
        const button = layout.buttons[index] || defaultButton;
        const pressed = pressedButtons[index] || false;
        const useCss = button.useCss ?? defaultButton.useCss ?? false;
        const className = `gamepad-button button${index} ${pressed ? "button-pressed" : "button-released"} ${useCss ? "button-css" : ""} ${editorMode && (selectedButtonIndex === index || selected.has(index)) ? "button-selected" : ""}`;
        return (
          <div
            id={`button${index}`}
            className={className}
            key={index}
            onClick={
              editorMode ? (event) => onButtonClick(index, event) : undefined
            }
            onMouseDown={
              editorMode
                ? (event) =>
                    onButtonMouseDown(
                      event,
                      index,
                      Number.parseFloat(button.x || defaultButton.x || "0"),
                      Number.parseFloat(button.y || defaultButton.y || "0"),
                    )
                : undefined
            }
            onContextMenu={
              editorMode
                ? (event) => onButtonContextMenu?.(index, event)
                : undefined
            }
            style={{
              ...buttonStyle(layout, button, defaultButton, pressed),
              cursor: editorMode ? "move" : undefined,
            }}
          />
        );
      })}
    </div>
  );
}
