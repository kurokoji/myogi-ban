import { ActionIcon, Paper, Text, Title } from "@mantine/core";
import { IconCopy } from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { UpdateDownloadState } from "../../update-manager";
import { ObsPluginUpdateControls } from "./ObsPluginUpdateControls";

interface ObsSetupPanelProps {
  obsUrl: string;
  copiedObsUrl: boolean;
  onCopyObsUrl: () => void;
  obsPluginAvailable: boolean;
  obsPluginDownload: UpdateDownloadState;
  onDownloadObsPlugin: () => void;
  onInstallObsPlugin: () => void;
}

export function ObsSetupPanel({
  obsUrl,
  copiedObsUrl,
  onCopyObsUrl,
  obsPluginAvailable,
  obsPluginDownload,
  onDownloadObsPlugin,
  onInstallObsPlugin,
}: ObsSetupPanelProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Paper className="panel" withBorder>
      <Title order={2}>{t("obsSetupTitle")}</Title>
      <p className="server-url">
        {t("obs")}: <span className="server-url-value">{obsUrl}</span>
        <ActionIcon
          size="sm"
          variant="light"
          aria-label={t("copy")}
          onClick={onCopyObsUrl}
        >
          <IconCopy size={16} />
        </ActionIcon>
        {copiedObsUrl && <span className="copy-feedback">{t("copied")}</span>}
      </p>
      <Text size="xs" c="dimmed">
        {t("obsTip")}
      </Text>
      {obsPluginAvailable && (
        <ObsPluginUpdateControls
          download={obsPluginDownload}
          onDownload={onDownloadObsPlugin}
          onInstall={onInstallObsPlugin}
        />
      )}
    </Paper>
  );
}
