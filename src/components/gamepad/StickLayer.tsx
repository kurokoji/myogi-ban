import type React from "react";
import { cssVariables } from "../../style-types";
import type { StickLayout } from "../../types";

interface StickLayerProps {
  stick: StickLayout;
  show: boolean;
  stickClass: string;
  scaleX: number;
  scaleY: number;
  editorMode: boolean;
  onDragMouseDown: (
    event: React.MouseEvent,
    initialX: number,
    initialY: number,
  ) => void;
  onCenterClick: (event: React.MouseEvent) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

export function StickLayer({
  stick,
  show,
  stickClass,
  scaleX,
  scaleY,
  editorMode,
  onDragMouseDown,
  onCenterClick,
  onContextMenu,
}: StickLayerProps): React.ReactElement {
  const direction = stickClass.startsWith("stick ") ? stickClass.slice(6) : "";
  return (
    <div
      id="stick-area"
      className="stick-area stick-css"
      style={{
        left: stick.x ? `${stick.x}px` : undefined,
        top: stick.y ? `${stick.y}px` : undefined,
        transform: `translate(-50%,-50%) scale(${scaleX},${scaleY})`,
        display: show ? undefined : "none",
        cursor: editorMode ? "move" : undefined,
        ...cssVariables({
          "--stick-color": stick.cssColor ?? "#cccccc",
          "--stick-plate-color": stick.cssPlateColor ?? "#888888",
          "--stick-transition": `${stick.cssTransition ?? "0.02"}s`,
          "--stick-easing": stick.cssEasing ?? "ease",
        }),
      }}
      onContextMenu={editorMode ? onContextMenu : undefined}
    >
      {editorMode && (
        <div
          className="stick-drag-handle"
          onMouseDown={(event) =>
            onDragMouseDown(
              event,
              Number.parseFloat(stick.x) || 110,
              Number.parseFloat(stick.y) || 125,
            )
          }
          onClick={onCenterClick}
        />
      )}
      <div
        id="stick-shaft"
        className={`stick-shaft${direction ? ` ${direction}` : ""}`}
      />
      <div id="stick" className={`${stickClass} stick-css`} />
    </div>
  );
}
