import { ActionIcon, Button, Group, Stack, TextInput } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { normalizeLayoutName } from "../../layout-name";

interface LayoutRenameControlsProps {
  layoutName: string;
  currentBuiltin: boolean;
  renameLayout: (name: string) => Promise<boolean>;
}

export function LayoutRenameControls(
  props: LayoutRenameControlsProps,
): React.ReactElement | null {
  const { t } = useTranslation();
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const normalizedRenameValue = normalizeLayoutName(renameValue);

  if (props.currentBuiltin) return null;

  const openRename = () => {
    setRenameValue(props.layoutName);
    setShowRename(true);
  };

  const confirmRename = async () => {
    if (!normalizedRenameValue) return;
    if (await props.renameLayout(renameValue)) setShowRename(false);
  };

  if (!showRename) {
    return (
      <ActionIcon
        size="sm"
        variant="subtle"
        aria-label={t("renameLayout")}
        onClick={openRename}
      >
        <IconPencil size={14} />
      </ActionIcon>
    );
  }

  return (
    <Stack gap="xs" className="layout-rename">
      <TextInput
        size="xs"
        label={t("layoutName")}
        value={renameValue}
        onChange={(event) => setRenameValue(event.target.value)}
        placeholder={t("layoutNamePlaceholder")}
        autoFocus
      />
      <Group gap="xs" grow>
        <Button
          size="xs"
          variant="default"
          onClick={() => setShowRename(false)}
        >
          {t("cancel")}
        </Button>
        <Button
          size="xs"
          onClick={confirmRename}
          disabled={!normalizedRenameValue}
        >
          {t("save")}
        </Button>
      </Group>
    </Stack>
  );
}
