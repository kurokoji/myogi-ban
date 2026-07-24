import type React from "react";
import type { Rect, RectCorner } from "../../geometry";

interface SelectionOverlaysProps {
  selectionRect: Rect | null;
  selectedGroupRect: Rect | null;
  snapGuides?: { x?: number; y?: number } | null;
  snapTargets?: Rect[];
  boundsPadding: number;
  resizable?: boolean;
  onBoundsMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBoundsClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onResizeMouseDown?: (
    event: React.MouseEvent<HTMLDivElement>,
    corner: RectCorner,
  ) => void;
}

export function SelectionOverlays({
  selectionRect,
  selectedGroupRect,
  snapGuides,
  snapTargets = [],
  boundsPadding,
  resizable = false,
  onBoundsMouseDown,
  onBoundsClick,
  onResizeMouseDown,
}: SelectionOverlaysProps): React.ReactElement {
  return (
    <>
      {snapGuides?.x !== undefined && (
        <div
          className="snap-guide snap-guide-vertical"
          style={{ left: snapGuides.x }}
        />
      )}
      {snapGuides?.y !== undefined && (
        <div
          className="snap-guide snap-guide-horizontal"
          style={{ top: snapGuides.y }}
        />
      )}
      {snapTargets.map((target, index) => (
        <div
          className="snap-target"
          key={`${target.left}:${target.top}:${index}`}
          style={{
            left: target.left,
            top: target.top,
            width: target.right - target.left,
            height: target.bottom - target.top,
          }}
        />
      ))}
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
        >
          {resizable &&
            (["nw", "ne", "sw", "se"] as const).map((corner) => (
              <div
                className={`resize-handle resize-handle-${corner}`}
                key={corner}
                onMouseDown={(event) => onResizeMouseDown?.(event, corner)}
              />
            ))}
        </div>
      )}
    </>
  );
}
