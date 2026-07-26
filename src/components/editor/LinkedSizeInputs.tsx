import { ActionIcon, Group, NumberInput } from "@mantine/core";
import { IconLink, IconUnlink } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { numericValue } from "../../editor-helpers";
import { resizeWithAspectRatio } from "../../linked-size";

interface LinkedSizeInputsProps {
  width: string;
  height: string;
  displayWidth?: string;
  displayHeight?: string;
  widthDescription?: string;
  heightDescription?: string;
  widthLabel: string;
  heightLabel: string;
  widthPlaceholder?: string;
  heightPlaceholder?: string;
  fallbackWidth?: string;
  fallbackHeight?: string;
  min?: number;
  linked?: boolean;
  onLinkedChange?: (linked: boolean) => void;
  onChange: (width: string, height: string) => void;
}

export function LinkedSizeInputs({
  width,
  height,
  displayWidth,
  displayHeight,
  widthDescription,
  heightDescription,
  widthLabel,
  heightLabel,
  widthPlaceholder,
  heightPlaceholder,
  fallbackWidth,
  fallbackHeight,
  min,
  linked: controlledLinked,
  onLinkedChange,
  onChange,
}: LinkedSizeInputsProps): React.ReactElement {
  const { t } = useTranslation();
  const [internalLinked, setInternalLinked] = useState(true);
  const linked = controlledLinked ?? internalLinked;

  const toggleLinked = () => {
    const next = !linked;
    if (controlledLinked === undefined) setInternalLinked(next);
    onLinkedChange?.(next);
  };

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
        description={widthDescription}
        min={min}
        value={numericValue(displayWidth ?? width)}
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
        onClick={toggleLinked}
      >
        {linked ? <IconLink size={16} /> : <IconUnlink size={16} />}
      </ActionIcon>
      <NumberInput
        size="xs"
        label={heightLabel}
        description={heightDescription}
        min={min}
        value={numericValue(displayHeight ?? height)}
        placeholder={heightPlaceholder}
        onChange={changeHeight}
        className="grow"
      />
    </Group>
  );
}
