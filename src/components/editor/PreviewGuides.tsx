import type React from "react";

type GuideAxis = "x" | "y";

interface PreviewGuidesProps {
  vertical: number[];
  horizontal: number[];
  origin: { x: number; y: number };
  scale: number;
  onStartExistingGuideDrag: (
    axis: GuideAxis,
    index: number,
    event: React.MouseEvent<HTMLElement>,
  ) => void;
}

export function PreviewGuides({
  vertical,
  horizontal,
  origin,
  scale,
  onStartExistingGuideDrag,
}: PreviewGuidesProps): React.ReactElement {
  return (
    <div className="preview-guides" aria-hidden="true">
      {vertical.map((guide, index) => (
        <span
          className="preview-guide preview-guide-vertical"
          key={`x-${index}`}
          onMouseDown={(event) => onStartExistingGuideDrag("x", index, event)}
          style={{ left: origin.x + guide * scale }}
        />
      ))}
      {horizontal.map((guide, index) => (
        <span
          className="preview-guide preview-guide-horizontal"
          key={`y-${index}`}
          onMouseDown={(event) => onStartExistingGuideDrag("y", index, event)}
          style={{ top: origin.y + guide * scale }}
        />
      ))}
    </div>
  );
}
