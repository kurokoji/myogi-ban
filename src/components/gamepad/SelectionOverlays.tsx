import { IconRotateClockwise } from "@tabler/icons-react";
import type React from "react";
import type { Rect, RectCorner } from "../../geometry";

interface SelectionOverlaysProps {
  selectionRect: Rect | null;
  selectedGroupRect: Rect | null;
  snapGuides?: { x?: number; y?: number } | null;
  snapTargets?: Rect[];
  boundsPadding: number;
  resizable?: boolean;
  rotatable?: boolean;
  rotation?: number;
  onBoundsMouseDown: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBoundsClick: (event: React.MouseEvent<HTMLDivElement>) => void;
  onBoundsContextMenu?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onResizeMouseDown?: (
    event: React.MouseEvent<HTMLDivElement>,
    corner: RectCorner,
  ) => void;
  onRotateMouseDown?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export function SelectionOverlays({
  selectionRect,
  selectedGroupRect,
  snapGuides,
  snapTargets = [],
  boundsPadding,
  resizable = false,
  rotatable = false,
  rotation = 0,
  onBoundsMouseDown,
  onBoundsClick,
  onBoundsContextMenu,
  onResizeMouseDown,
  onRotateMouseDown,
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
          onContextMenu={onBoundsContextMenu}
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
            transform: rotatable ? `rotate(${rotation}deg)` : undefined,
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
          {rotatable && (
            <div className="rotation-handle-stem">
              <div className="rotation-handle" onMouseDown={onRotateMouseDown}>
                <IconRotateClockwise size={17} stroke={2.5} />
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
