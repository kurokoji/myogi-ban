import { Stack } from "@mantine/core";
import type React from "react";
import { useTranslation } from "react-i18next";
import { ColorInput, LabeledSwitch } from "./EditorInputs";

interface ButtonBorderColorControlsProps {
  className: string;
  matchesColor: boolean;
  matchesColorDescription?: string;
  borderColor: string;
  borderColorDescription?: string;
  pressedBorderColor: string;
  pressedBorderColorDescription?: string;
  onMatchesColorChange: (matches: boolean) => void;
  onBorderColorChange: (color: string) => void;
  onPressedBorderColorChange: (color: string) => void;
}

export function ButtonBorderColorControls({
  className,
  matchesColor,
  matchesColorDescription,
  borderColor,
  borderColorDescription,
  pressedBorderColor,
  pressedBorderColorDescription,
  onMatchesColorChange,
  onBorderColorChange,
  onPressedBorderColorChange,
}: ButtonBorderColorControlsProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <Stack gap="xs" className={`button-border-color-controls ${className}`}>
      <LabeledSwitch
        label={t("borderMatchesColor")}
        description={matchesColorDescription}
        checked={matchesColor}
        onChange={(event) => onMatchesColorChange(event.target.checked)}
      />
      {!matchesColor && (
        <ColorInput
          label={t("borderColor")}
          description={borderColorDescription}
          value={borderColor}
          onChange={(event) => onBorderColorChange(event.target.value)}
        />
      )}
      {!matchesColor && (
        <ColorInput
          label={t("borderColorPressed")}
          description={pressedBorderColorDescription}
          value={pressedBorderColor}
          onChange={(event) => onPressedBorderColorChange(event.target.value)}
        />
      )}
    </Stack>
  );
}
