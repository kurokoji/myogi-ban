import { createPortal } from "react-dom";

interface DragCoordinateTooltipProps {
  x: number;
  y: number;
  label: string;
}

export function DragCoordinateTooltip({
  x,
  y,
  label,
}: DragCoordinateTooltipProps): React.ReactElement {
  return createPortal(
    <div className="drag-coordinate-tooltip" style={{ left: x, top: y }}>
      {label}
    </div>,
    document.body,
  );
}
