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
  onConfirm,
  onCancel,
}: LayoutImportPreviewModalProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <Modal
      opened={preview != null}
      onClose={onCancel}
      title={t("importPreviewTitle")}
      centered
      withinPortal={false}
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
            <Button variant="default" onClick={onCancel}>
              {t("cancel")}
            </Button>
            <Button onClick={onConfirm}>{t("confirmImport")}</Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
