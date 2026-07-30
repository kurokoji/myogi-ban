import { Button, Modal, Text, Typography } from "@mantine/core";
import Markdown from "markdown-to-jsx";
import { useTranslation } from "react-i18next";
import type { ReleaseNotes } from "../../whats-new-manager";

interface WhatsNewPopupProps {
  notes: ReleaseNotes | null;
  onClose: () => void;
}

export function WhatsNewPopup({
  notes,
  onClose,
}: WhatsNewPopupProps): React.ReactElement | null {
  const { t } = useTranslation();

  if (!notes) return null;

  return (
    <Modal
      opened
      onClose={onClose}
      centered
      withinPortal={false}
      transitionProps={{ duration: 0 }}
      title={t("whatsNewTitle", { version: notes.version })}
      closeButtonProps={{ "aria-label": t("close") }}
    >
      {notes.notes ? (
        <Typography>
          <Markdown>{notes.notes}</Markdown>
        </Typography>
      ) : (
        <>
          <Text size="sm">{t("releaseNotesUnavailable")}</Text>
          <Button
            size="xs"
            variant="light"
            mt="xs"
            component="a"
            href={notes.releaseUrl}
            target="_blank"
            rel="noreferrer"
          >
            {t("openReleasePage")}
          </Button>
        </>
      )}
    </Modal>
  );
}
