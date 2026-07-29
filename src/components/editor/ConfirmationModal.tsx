import { Button, Group, Modal, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface ConfirmationModalProps {
  message: string | null;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Renders discard/delete confirmations in-app instead of window.confirm().
 * In Electron, window.confirm() is a native blocking dialog; closing it can
 * leave the renderer's focus state desynced from the OS window, which stops
 * native controls like NativeSelect's <select> from responding until the
 * window loses and regains focus.
 */
export function ConfirmationModal({
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmationModalProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <Modal
      opened={message != null}
      onClose={onCancel}
      centered
      withinPortal={false}
      transitionProps={{ duration: 0 }}
      withCloseButton={false}
    >
      {message && (
        <>
          <Text size="sm">{message}</Text>
          <Group gap="xs" justify="flex-end" mt="md">
            <Button variant="default" onClick={onCancel}>
              {t("cancel")}
            </Button>
            <Button color="red" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
