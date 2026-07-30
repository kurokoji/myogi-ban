import { Button, Group, Modal, Progress, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { UpdateStatus } from "../../update-manager";

interface UpdatePopupProps {
  status: UpdateStatus | null;
  dismissed: boolean;
  actionError: string | null;
  onClose: () => void;
  onDownload: () => void;
  onInstall: () => void;
  onDownloadObsPlugin: () => void;
  onInstallObsPlugin: () => void;
}

export function UpdatePopup({
  status,
  dismissed,
  actionError,
  onClose,
  onDownload,
  onInstall,
  onDownloadObsPlugin,
  onInstallObsPlugin,
}: UpdatePopupProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (!status?.updateAvailable || dismissed) return null;

  return (
    <Modal
      opened
      onClose={onClose}
      centered
      withinPortal={false}
      transitionProps={{ duration: 0 }}
      title={t("updateAvailable", { version: status.latestVersion ?? "" })}
      closeButtonProps={{ "aria-label": t("close") }}
    >
      <Group gap="xs" wrap="nowrap">
        {!status.installSupported && status.releaseUrl && (
          <Button
            size="xs"
            variant="light"
            component="a"
            href={status.releaseUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("openReleasePage")}
          </Button>
        )}
        {status.installSupported && status.download.state === "downloading" && (
          <Group gap="xs" wrap="nowrap">
            <Progress size="sm" w={80} value={status.download.progress * 100} />
            <Text size="xs">{Math.round(status.download.progress * 100)}%</Text>
          </Group>
        )}
        {status.installSupported &&
          (status.download.state === "idle" ||
            status.download.state === "error") && (
            <Button size="xs" variant="light" onClick={onDownload}>
              {t("downloadUpdate")}
            </Button>
          )}
        {status.installSupported && status.download.state === "downloaded" && (
          <Button size="xs" onClick={onInstall}>
            {t("installUpdate")}
          </Button>
        )}
      </Group>
      {status.download.state === "error" && (
        <Text size="xs" c="red">
          {status.download.message}
        </Text>
      )}
      {status.installSupported && status.obsPluginAvailable && (
        <>
          <Text size="xs" mt="xs">
            {t("obsPluginUpdateAvailable")}
          </Text>
          <Group gap="xs" wrap="nowrap">
            {status.obsPluginDownload.state === "downloading" && (
              <Group gap="xs" wrap="nowrap">
                <Progress
                  size="sm"
                  w={80}
                  value={status.obsPluginDownload.progress * 100}
                />
                <Text size="xs">
                  {Math.round(status.obsPluginDownload.progress * 100)}%
                </Text>
              </Group>
            )}
            {(status.obsPluginDownload.state === "idle" ||
              status.obsPluginDownload.state === "error") && (
              <Button size="xs" variant="light" onClick={onDownloadObsPlugin}>
                {t("downloadObsPluginUpdate")}
              </Button>
            )}
            {status.obsPluginDownload.state === "downloaded" && (
              <Button size="xs" onClick={onInstallObsPlugin}>
                {t("installObsPluginUpdate")}
              </Button>
            )}
          </Group>
          {status.obsPluginDownload.state === "error" && (
            <Text size="xs" c="red">
              {status.obsPluginDownload.message}
            </Text>
          )}
        </>
      )}
      {actionError && (
        <Text size="xs" c="red">
          {actionError}
        </Text>
      )}
    </Modal>
  );
}
