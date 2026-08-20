import { Stack } from "@mantine/core";
import type React from "react";
import { useTranslation } from "react-i18next";
import { ColorInput, LabeledSwitch } from "./EditorInputs";

interface TextOutlineControlsProps {
  className: string;
  outline: boolean;
  outlineDescription?: string;
  color: string;
  colorDescription?: string;
  onOutlineChange: (outline: boolean) => void;
  onColorChange: (color: string) => void;
}

/**
 * A switch that reveals a color picker once turned on, stacked vertically
 * like ButtonBorderColorControls's own switch-then-colors layout rather
 * than placed beside a sibling control. Putting the color picker on its
 * own line below the switch, instead of next to it in a row, sidesteps
 * having to keep two differently-shaped controls' heights in sync.
 */
export function TextOutlineControls({
  className,
  outline,
  outlineDescription,
  color,
  colorDescription,
  onOutlineChange,
  onColorChange,
}: TextOutlineControlsProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <Stack gap="xs" className={`text-outline-controls ${className}`}>
      <LabeledSwitch
        label={t("textOutline")}
        description={outlineDescription}
        descriptionPlacement="inline"
        checked={outline}
        onChange={(event) => onOutlineChange(event.target.checked)}
      />
      {outline && (
        <ColorInput
          label={t("textOutlineColor")}
          description={colorDescription}
          value={color}
          onChange={(event) => onColorChange(event.target.value)}
        />
      )}
    </Stack>
  );
}
