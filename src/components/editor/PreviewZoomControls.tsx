import { ActionIcon, UnstyledButton } from "@mantine/core";
import { IconMagnet, IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface PreviewZoomControlsProps {
  zoomPercent: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  snappingEnabled: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  onSnappingChange: (enabled: boolean) => void;
}

export function PreviewZoomControls(
  props: PreviewZoomControlsProps,
): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div
      className="preview-toolbar"
      role="toolbar"
      aria-label={t("previewControls")}
    >
      <ActionIcon
        size="sm"
        variant={props.snappingEnabled ? "filled" : "light"}
        aria-label={t("snapping")}
        aria-pressed={props.snappingEnabled}
        title={t("snapping")}
        onClick={() => props.onSnappingChange(!props.snappingEnabled)}
      >
        <IconMagnet size={16} />
      </ActionIcon>
      <ActionIcon
        size="sm"
        variant="light"
        aria-label={t("zoomOut")}
        onClick={props.onZoomOut}
        disabled={!props.canZoomOut}
      >
        <IconZoomOut size={16} />
      </ActionIcon>
      <UnstyledButton
        className="preview-zoom-value"
        aria-label={t("resetZoom")}
        title={t("resetZoom")}
        onClick={props.onReset}
      >
        {props.zoomPercent}%
      </UnstyledButton>
      <ActionIcon
        size="sm"
        variant="light"
        aria-label={t("zoomIn")}
        onClick={props.onZoomIn}
        disabled={!props.canZoomIn}
      >
        <IconZoomIn size={16} />
      </ActionIcon>
    </div>
  );
}
