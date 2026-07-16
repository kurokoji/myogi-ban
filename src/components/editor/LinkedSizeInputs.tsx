import { ActionIcon, Group, NumberInput } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { numericValue } from "../../editor-helpers";

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

function effectiveNumber(value: string, fallback = ""): number | null {
  const parsed = Number.parseFloat(value || fallback);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function formatDimension(value: number): string {
  return String(Math.round(value * 10000) / 10000);
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
    const nextWidth = String(value ?? "");
    const oldWidth = effectiveNumber(width, fallbackWidth);
    const oldHeight = effectiveNumber(height, fallbackHeight);
    const numericWidth = effectiveNumber(nextWidth);
    const nextHeight =
      linked && numericWidth !== null && oldWidth !== null && oldHeight !== null
        ? formatDimension((numericWidth * oldHeight) / oldWidth)
        : height;
    onChange(nextWidth, nextHeight);
  };

  const changeHeight = (value: string | number) => {
    const nextHeight = String(value ?? "");
    const oldWidth = effectiveNumber(width, fallbackWidth);
    const oldHeight = effectiveNumber(height, fallbackHeight);
    const numericHeight = effectiveNumber(nextHeight);
    const nextWidth =
      linked &&
      numericHeight !== null &&
      oldWidth !== null &&
      oldHeight !== null
        ? formatDimension((numericHeight * oldWidth) / oldHeight)
        : width;
    onChange(nextWidth, nextHeight);
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
