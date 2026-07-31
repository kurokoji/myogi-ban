import { Button, Group, Progress, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { UpdateDownloadState } from "../../update-manager";

interface ObsPluginUpdateControlsProps {
  download: UpdateDownloadState;
  installing: boolean;
  onDownload: () => void;
  onInstall: () => void;
}

export function ObsPluginUpdateControls({
  download,
  installing,
  onDownload,
  onInstall,
}: ObsPluginUpdateControlsProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <div className="obs-plugin-update">
      <Text size="xs" c="dimmed" mt="xs">
        {t("obsPluginUpdateAvailable")}
      </Text>
      <Group gap="xs" wrap="nowrap" mt="xs">
        {download.state === "downloading" && (
          <Group gap="xs" wrap="nowrap">
            <Progress size="sm" w={80} value={download.progress * 100} />
            <Text size="xs">{Math.round(download.progress * 100)}%</Text>
          </Group>
        )}
        {(download.state === "idle" || download.state === "error") && (
          <Button size="xs" variant="light" onClick={onDownload}>
            {t("downloadObsPluginUpdate")}
          </Button>
        )}
        {download.state === "downloaded" && (
          <Button size="xs" loading={installing} onClick={onInstall}>
            {t("installObsPluginUpdate")}
          </Button>
        )}
      </Group>
      {download.state === "error" && (
        <Text size="xs" c="red">
          {download.message}
        </Text>
      )}
    </div>
  );
}
