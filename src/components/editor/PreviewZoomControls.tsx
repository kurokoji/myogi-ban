import { ActionIcon, UnstyledButton } from "@mantine/core";
import { IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";

interface PreviewZoomControlsProps {
  zoomPercent: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function PreviewZoomControls(
  props: PreviewZoomControlsProps,
): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div
      className="preview-toolbar"
      role="toolbar"
      aria-label={t("previewZoom")}
    >
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
