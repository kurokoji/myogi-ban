import { IconArrowBigUpFilled } from "@tabler/icons-react";
import type React from "react";
import { STICK_NAMES } from "../../types";

const ZONE_SIZE = 40;
const ZONE_OFFSET = 46;

const ZONE_VECTORS: Record<
  (typeof STICK_NAMES)[number],
  { dx: number; dy: number; rotation: number }
> = {
  "stick-up": { dx: 0, dy: -1, rotation: 0 },
  "stick-down": { dx: 0, dy: 1, rotation: 180 },
  "stick-left": { dx: -1, dy: 0, rotation: 270 },
  "stick-right": { dx: 1, dy: 0, rotation: 90 },
};

interface StickDirectionZonesProps {
  centerX: number;
  centerY: number;
  scaleX: number;
  scaleY: number;
  onDirectionClick: (index: number, event: React.MouseEvent) => void;
}

/**
 * Renders the up/down/left/right click targets as siblings of the
 * selection-bounds overlay (not nested inside StickLayer's transformed
 * #stick-area) so their z-index can actually outrank it. #stick-area
 * establishes its own stacking context via transform, which caps every
 * descendant's z-index below whatever stacking order #stick-area itself
 * gets among its own siblings - nesting these here would leave them
 * losing to .selection-bounds no matter how high their z-index was set.
 */
export function StickDirectionZones({
  centerX,
  centerY,
  scaleX,
  scaleY,
  onDirectionClick,
}: StickDirectionZonesProps): React.ReactElement {
  return (
    <>
      {STICK_NAMES.map((name, index) => {
        const { dx, dy, rotation } = ZONE_VECTORS[name];
        const width = ZONE_SIZE * scaleX;
        const height = ZONE_SIZE * scaleY;
        return (
          <div
            id={name}
            key={name}
            className="stick-block stick-block-active"
            style={{
              left: centerX + dx * ZONE_OFFSET * scaleX - width / 2,
              top: centerY + dy * ZONE_OFFSET * scaleY - height / 2,
              width,
              height,
            }}
            onClick={(event) => onDirectionClick(index, event)}
          >
            <IconArrowBigUpFilled
              size={32}
              style={{ transform: `rotate(${rotation}deg)` }}
            />
          </div>
        );
      })}
    </>
  );
}
