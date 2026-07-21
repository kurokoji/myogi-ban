import { Button, Group, Modal, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

export interface LayoutImportPreview {
  name: string;
  savedName: string;
  formatVersion: number;
  imageCount: number;
  imageBytes: number;
}

interface LayoutImportPreviewModalProps {
  preview: LayoutImportPreview | null;
  inProgress: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function LayoutImportPreviewModal({
  preview,
  inProgress,
  onConfirm,
  onCancel,
}: LayoutImportPreviewModalProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <Modal
      opened={preview != null}
      onClose={() => {
        if (!inProgress) onCancel();
      }}
      title={t("importPreviewTitle")}
      centered
      withinPortal={false}
      closeOnClickOutside={!inProgress}
      closeOnEscape={!inProgress}
      transitionProps={{ duration: 0 }}
    >
      {preview && (
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm">{t("importLayoutName")}</Text>
            <Text size="sm" fw={600}>
              {preview.name}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">{t("importSavedName")}</Text>
            <Text size="sm" fw={600}>
              {preview.savedName}
            </Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">{t("importFormatVersion")}</Text>
            <Text size="sm">v{preview.formatVersion}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">{t("importImageCount")}</Text>
            <Text size="sm">{preview.imageCount}</Text>
          </Group>
          <Group justify="space-between">
            <Text size="sm">{t("importImageSize")}</Text>
            <Text size="sm">{formatBytes(preview.imageBytes)}</Text>
          </Group>
          <Group gap="xs" grow mt="xs">
            <Button variant="default" onClick={onCancel} disabled={inProgress}>
              {t("cancel")}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={inProgress}
              aria-label={t("confirmImport")}
            >
              {t(inProgress ? "importing" : "confirmImport")}
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
