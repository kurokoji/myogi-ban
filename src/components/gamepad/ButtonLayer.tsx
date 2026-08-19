import type React from "react";
import { resolveButtonAppearance } from "../../button-appearance";
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
  const appearance = resolveButtonAppearance(button, defaultButton);
  const useImage = pressed ? pressedImage : releasedImage;
  const textStrokeWidth = appearance.textOutline
    ? `${Math.max(1, Math.round(Number.parseFloat(appearance.textSize) * 0.12))}px`
    : "0px";
  const style: CSSVariableStyle = cssVariables({
    left: `${button.x || defaultButton.x || 0}px`,
    top: `${button.y || defaultButton.y || 0}px`,
    width: `${releasedWidth || defaultButton.w || "60"}px`,
    height: `${releasedHeight || defaultButton.h || "60"}px`,
    "--button-color": pressed ? appearance.pressedColor : appearance.color,
    "--button-border-color": pressed
      ? appearance.pressedBorderColor
      : appearance.borderColor,
    "--button-shadow-color": pressed
      ? "rgba(0, 0, 0, 0.4)"
      : "rgba(0, 0, 0, 0.2)",
    "--button-rotation": `${appearance.rotation}deg`,
    "--button-radius": buttonRadiusForShape(appearance.shape),
    "--button-transition": `${appearance.transition}s`,
    "--button-easing": appearance.easing,
    "--button-text-color": appearance.textColor,
    "--button-text-size": `${appearance.textSize}px`,
    "--button-text-weight": appearance.textBold ? "bold" : "normal",
    "--button-text-style": appearance.textItalic ? "italic" : "normal",
    "--button-text-stroke-width": textStrokeWidth,
    "--button-text-stroke-color": appearance.textOutlineColor,
    "--button-text-rotation": `${appearance.textRotation}deg`,
  });
  if (!appearance.useCss && useImage) {
    style.backgroundImage = `url("layout/${layout.id || layout.name}/${useImage}")`;
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
        const appearance = resolveButtonAppearance(button, defaultButton);
        const label = button.text ?? defaultButton.text ?? "";
        const className = `gamepad-button button${index} ${pressed ? "button-pressed" : "button-released"} ${appearance.useCss ? "button-css" : ""} ${editorMode && (selectedButtonIndex === index || selected.has(index)) ? "button-selected" : ""}`;
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
          >
            {label && (
              <span
                className={`gamepad-button-label ${appearance.textOutline ? "gamepad-button-label-outline" : ""}`}
              >
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
