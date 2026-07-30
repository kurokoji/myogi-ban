import { ActionIcon, Button, Group, Stack, TextInput } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { isLayoutNameTaken, normalizeLayoutName } from "../../layout-name";
import type { LayoutEntry } from "../../types";

interface LayoutRenameControlsProps {
  layoutNames: LayoutEntry[];
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
  const isSameName =
    normalizedRenameValue === normalizeLayoutName(props.layoutName);
  const renameNameExists =
    !isSameName && isLayoutNameTaken(renameValue, props.layoutNames);

  if (props.currentBuiltin) return null;

  const openRename = () => {
    setRenameValue(props.layoutName);
    setShowRename(true);
  };

  const confirmRename = async () => {
    if (!normalizedRenameValue || renameNameExists) return;
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
        error={renameNameExists ? t("layoutNameExists") : undefined}
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
          disabled={!normalizedRenameValue || renameNameExists}
        >
          {t("save")}
        </Button>
      </Group>
    </Stack>
  );
}
