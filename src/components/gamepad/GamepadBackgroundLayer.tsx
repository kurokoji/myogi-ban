import type React from "react";
import { cssVariables } from "../../style-types";
import type { BackgroundConfig } from "../../types";

interface GamepadBackgroundLayerProps {
  background: BackgroundConfig;
  layoutName: string;
  width: number;
  height: number;
  opacity: number;
}

export function GamepadBackgroundLayer({
  background,
  layoutName,
  width,
  height,
  opacity,
}: GamepadBackgroundLayerProps): React.ReactElement {
  const imageStyle = background.image
    ? { backgroundImage: `url("layout/${layoutName}/${background.image}")` }
    : {};
  return (
    <div
      id="gamepad-area-background"
      className={`gamepad-area-background${background.useCss ? " background-css" : ""}`}
      style={{
        ...(background.useCss
          ? cssVariables({
              "--bg-color": background.cssColor ?? "#0b0f14",
              "--bg-radius": `${background.cssBorderRadius ?? 0}px`,
            })
          : imageStyle),
        borderRadius: `${background.cssBorderRadius ?? 0}px`,
        width,
        height,
        opacity,
        visibility: background.show === false ? "hidden" : "visible",
      }}
    />
  );
}
