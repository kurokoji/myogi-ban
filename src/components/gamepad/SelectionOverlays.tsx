import type React from "react";
import type { Rect } from "../../geometry";

interface SelectionOverlaysProps {
  selectionRect: Rect | null;
  selectedGroupRect: Rect | null;
  boundsPadding: number;
  onBoundsMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBoundsClick: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export function SelectionOverlays({
  selectionRect,
  selectedGroupRect,
  boundsPadding,
  onBoundsMouseDown,
  onBoundsClick,
}: SelectionOverlaysProps): React.ReactElement {
  return (
    <>
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
          onMouseDown={onBoundsMouseDown}
          onClick={onBoundsClick}
          style={{
            left: selectedGroupRect.left - boundsPadding,
            top: selectedGroupRect.top - boundsPadding,
            width:
              selectedGroupRect.right -
              selectedGroupRect.left +
              boundsPadding * 2,
            height:
              selectedGroupRect.bottom -
              selectedGroupRect.top +
              boundsPadding * 2,
          }}
        />
      )}
    </>
  );
}
