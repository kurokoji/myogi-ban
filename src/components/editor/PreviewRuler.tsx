import type React from "react";

type GuideAxis = "x" | "y";

interface PreviewRulerProps {
  ticks: number[];
  majorStep: number;
  origin: { x: number; y: number };
  scale: number;
  onStartGuideDrag: (
    axis: GuideAxis,
    event: React.MouseEvent<HTMLElement>,
  ) => void;
}

export function PreviewRuler({
  ticks,
  majorStep,
  origin,
  scale,
  onStartGuideDrag,
}: PreviewRulerProps): React.ReactElement {
  return (
    <>
      <div className="preview-ruler-corner" aria-hidden="true" />
      <div
        className="preview-ruler preview-ruler-horizontal"
        aria-hidden="true"
        onMouseDown={(event) => onStartGuideDrag("y", event)}
      >
        {ticks.map((value) => {
          const major = value % majorStep === 0;
          return (
            <span
              className={`preview-ruler-tick ${major ? "preview-ruler-tick-major" : ""}`}
              key={value}
              style={{
                left: `calc(${origin.x + value * scale}px - var(--preview-ruler-size))`,
              }}
            >
              {major && <span className="preview-ruler-label">{value}</span>}
            </span>
          );
        })}
      </div>
      <div
        className="preview-ruler preview-ruler-vertical"
        aria-hidden="true"
        onMouseDown={(event) => onStartGuideDrag("x", event)}
      >
        {ticks.map((value) => {
          const major = value % majorStep === 0;
          return (
            <span
              className={`preview-ruler-tick ${major ? "preview-ruler-tick-major" : ""}`}
              key={value}
              style={{
                top: `calc(${origin.y + value * scale}px - var(--preview-ruler-size))`,
              }}
            >
              {major && <span className="preview-ruler-label">{value}</span>}
            </span>
          );
        })}
      </div>
    </>
  );
}
