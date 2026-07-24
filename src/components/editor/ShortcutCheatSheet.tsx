import { ActionIcon, Kbd, Modal, Tooltip } from "@mantine/core";
import { IconKeyboard } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { editorShortcutHint } from "../../editor-keyboard";

interface ShortcutCheatSheetProps {
  platform?: string;
}

export function ShortcutCheatSheet({
  platform,
}: ShortcutCheatSheetProps): React.ReactElement {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const rows = [
    [t("overwriteSave"), editorShortcutHint("save", platform)],
    [t("undo"), editorShortcutHint("undo", platform)],
    [t("redo"), editorShortcutHint("redo", platform)],
    [t("selectAll"), editorShortcutHint("selectAll", platform)],
    [t("clearSelection"), editorShortcutHint("clearSelection", platform)],
    [t("duplicateSelection"), editorShortcutHint("duplicate", platform)],
    [t("deleteSelection"), editorShortcutHint("delete", platform)],
    [t("resetRotation"), editorShortcutHint("resetRotation", platform)],
    [t("moveSelection"), editorShortcutHint("move", platform)],
    [t("zoomWithWheel"), editorShortcutHint("zoom", platform)],
  ];

  useEffect(() => {
    if (!opened) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpened(false);
    };
    document.addEventListener("keydown", closeOnEscape, true);
    return () => document.removeEventListener("keydown", closeOnEscape, true);
  }, [opened]);

  return (
    <>
      <Tooltip label={t("keyboardShortcuts")} openDelay={300}>
        <ActionIcon
          size="sm"
          variant="light"
          aria-label={t("keyboardShortcuts")}
          onClick={() => setOpened(true)}
        >
          <IconKeyboard size={16} />
        </ActionIcon>
      </Tooltip>
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={t("keyboardShortcuts")}
        centered
        size="sm"
        transitionProps={{ duration: 0 }}
      >
        <dl className="shortcut-cheat-sheet">
          {rows.map(([label, shortcut]) => (
            <div className="shortcut-cheat-sheet-row" key={label}>
              <dt>{label}</dt>
              <dd>
                <Kbd className="shortcut-cheat-sheet-key">{shortcut}</Kbd>
              </dd>
            </div>
          ))}
        </dl>
      </Modal>
    </>
  );
}
