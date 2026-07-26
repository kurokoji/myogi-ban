import { useTranslation } from "react-i18next";
import { LinkedSizeInputs } from "./LinkedSizeInputs";

interface InheritedSizeInputsProps {
  width: string | undefined;
  height: string | undefined;
  defaultWidth: string;
  defaultHeight: string;
  effectiveWidth: string;
  effectiveHeight: string;
  widthLabel: string;
  heightLabel: string;
  linked?: boolean;
  onLinkedChange?: (linked: boolean) => void;
  onChange: (width: string, height: string) => void;
}

export function InheritedSizeInputs({
  width = "",
  height = "",
  defaultWidth,
  defaultHeight,
  effectiveWidth,
  effectiveHeight,
  widthLabel,
  heightLabel,
  linked,
  onLinkedChange,
  onChange,
}: InheritedSizeInputsProps): React.ReactElement {
  const { t } = useTranslation();
  const widthInherited = !width || width === defaultWidth;
  const heightInherited = !height || height === defaultHeight;

  return (
    <LinkedSizeInputs
      width={widthInherited ? "" : width}
      height={heightInherited ? "" : height}
      displayWidth={width || effectiveWidth}
      displayHeight={height || effectiveHeight}
      widthDescription={widthInherited ? t("inheritDefault") : undefined}
      heightDescription={heightInherited ? t("inheritDefault") : undefined}
      widthLabel={widthLabel}
      heightLabel={heightLabel}
      widthPlaceholder={effectiveWidth}
      heightPlaceholder={effectiveHeight}
      fallbackWidth={effectiveWidth}
      fallbackHeight={effectiveHeight}
      linked={linked}
      onLinkedChange={onLinkedChange}
      onChange={onChange}
    />
  );
}
