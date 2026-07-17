import { ActionIcon, Group, NumberInput } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { numericValue } from "../../editor-helpers";
import { resizeWithAspectRatio } from "../../linked-size";

interface LinkedSizeInputsProps {
  width: string;
  height: string;
  widthLabel: string;
  heightLabel: string;
  widthPlaceholder?: string;
  heightPlaceholder?: string;
  fallbackWidth?: string;
  fallbackHeight?: string;
  min?: number;
  onChange: (width: string, height: string) => void;
}

export function LinkedSizeInputs({
  width,
  height,
  widthLabel,
  heightLabel,
  widthPlaceholder,
  heightPlaceholder,
  fallbackWidth,
  fallbackHeight,
  min,
  onChange,
}: LinkedSizeInputsProps): React.ReactElement {
  const { t } = useTranslation();
  const [linked, setLinked] = useState(true);

  const changeWidth = (value: string | number) => {
    const next = resizeWithAspectRatio({
      width,
      height,
      nextValue: value,
      changed: "width",
      linked,
      fallbackWidth,
      fallbackHeight,
    });
    onChange(next.width, next.height);
  };

  const changeHeight = (value: string | number) => {
    const next = resizeWithAspectRatio({
      width,
      height,
      nextValue: value,
      changed: "height",
      linked,
      fallbackWidth,
      fallbackHeight,
    });
    onChange(next.width, next.height);
  };

  return (
    <Group gap="xs" align="end" wrap="nowrap">
      <NumberInput
        size="xs"
        label={widthLabel}
        min={min}
        value={numericValue(width)}
        placeholder={widthPlaceholder}
        onChange={changeWidth}
        className="grow"
      />
      <ActionIcon
        size="md"
        variant={linked ? "filled" : "light"}
        aria-label={linked ? t("unlinkAspectRatio") : t("linkAspectRatio")}
        title={linked ? t("unlinkAspectRatio") : t("linkAspectRatio")}
        aria-pressed={linked}
        onClick={() => setLinked((current) => !current)}
      >
        🔗
      </ActionIcon>
      <NumberInput
        size="xs"
        label={heightLabel}
        min={min}
        value={numericValue(height)}
        placeholder={heightPlaceholder}
        onChange={changeHeight}
        className="grow"
      />
    </Group>
  );
}
