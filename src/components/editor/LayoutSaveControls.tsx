import { Button, Group, Stack, Text, TextInput } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { editorShortcutHint } from "../../editor-keyboard";
import { isLayoutNameTaken, normalizeLayoutName } from "../../layout-name";
import type { LayoutEntry } from "../../types";

interface LayoutSaveControlsProps {
  layoutNames: LayoutEntry[];
  layoutName: string;
  currentBuiltin: boolean;
  saveLayout: () => void;
  saveLayoutAs: (name: string) => Promise<boolean>;
}

export function LayoutSaveControls(
  props: LayoutSaveControlsProps,
): React.ReactElement {
  const { t } = useTranslation();
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");
  const normalizedSaveAsName = normalizeLayoutName(saveAsName);
  const saveAsNameExists = isLayoutNameTaken(saveAsName, props.layoutNames);

  const openSaveAs = () => {
    setSaveAsName(
      props.currentBuiltin ? `${props.layoutName}-copy` : props.layoutName,
    );
    setShowSaveAs(true);
  };

  const confirmSaveAs = async () => {
    if (!normalizedSaveAsName || saveAsNameExists) return;
    if (await props.saveLayoutAs(saveAsName)) setShowSaveAs(false);
  };

  return (
    <>
      <Button
        size="xs"
        fullWidth
        title={`${t("overwriteSave")} (${editorShortcutHint("save")})`}
        onClick={props.saveLayout}
        disabled={props.currentBuiltin}
      >
        {t("overwriteSave")}
      </Button>
      {props.currentBuiltin && (
        <Text size="xs" c="dimmed">
          {t("builtInSaveHint")}
        </Text>
      )}
      <Button size="xs" variant="light" fullWidth onClick={openSaveAs}>
        {t("saveAs")}
      </Button>
      {showSaveAs && (
        <Stack gap="xs" className="layout-save-as">
          <TextInput
            size="xs"
            label={t("layoutName")}
            value={saveAsName}
            onChange={(event) => setSaveAsName(event.target.value)}
            placeholder={t("layoutNamePlaceholder")}
            error={saveAsNameExists ? t("layoutNameExists") : undefined}
            autoFocus
          />
          <Group gap="xs" grow>
            <Button
              size="xs"
              variant="default"
              onClick={() => setShowSaveAs(false)}
            >
              {t("cancel")}
            </Button>
            <Button
              size="xs"
              onClick={confirmSaveAs}
              disabled={!normalizedSaveAsName || saveAsNameExists}
            >
              {t("save")}
            </Button>
          </Group>
        </Stack>
      )}
    </>
  );
}
