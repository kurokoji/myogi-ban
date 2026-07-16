import {
  Button,
  Group,
  NativeSelect,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { type ChangeEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutEntry, OperationStatus } from "../../types";

interface LayoutSettingsPanelProps {
  layoutNames: LayoutEntry[];
  selectedLayout: string;
  layoutName: string;
  currentBuiltin: boolean;
  isDirty: boolean;
  status: OperationStatus;
  openLayout: (value: string) => void;
  saveLayout: () => void;
  saveLayoutAs: (name: string) => void;
  setDefaultLayout: () => void;
  exportLayout: () => void;
  importLayout: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function LayoutSettingsPanel(
  props: LayoutSettingsPanelProps,
): React.ReactElement {
  const { t } = useTranslation();
  const [showSaveAs, setShowSaveAs] = useState(false);
  const [saveAsName, setSaveAsName] = useState("");

  const openSaveAs = () => {
    setSaveAsName(
      props.currentBuiltin ? `${props.layoutName}-copy` : props.layoutName,
    );
    setShowSaveAs(true);
  };

  const confirmSaveAs = () => {
    if (!saveAsName.trim()) return;
    props.saveLayoutAs(saveAsName);
    setShowSaveAs(false);
  };

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t("layout")}</Title>
        <div className="layout-current">
          <Text size="xs" c="dimmed">
            {t("currentLayout")}
          </Text>
          <Group gap="xs">
            <Text size="sm" fw={600}>
              {props.layoutName}
            </Text>
            {props.currentBuiltin && (
              <Text size="xs" c="dimmed">
                ({t("builtIn")})
              </Text>
            )}
            {props.isDirty && (
              <Text size="xs" c="orange">
                {t("unsavedChanges")}
              </Text>
            )}
          </Group>
        </div>
        <Text size="xs" fw={600}>
          {t("openLayout")}
        </Text>
        <NativeSelect
          size="xs"
          value={props.selectedLayout}
          onChange={(event) => props.openLayout(event.target.value)}
          data={props.layoutNames.map((entry) => ({
            value: `${entry.name}:${entry.builtin ? "builtin" : "user"}`,
            label: entry.builtin
              ? `${entry.name} (${t("builtIn")})`
              : entry.name,
          }))}
        />
        <Button
          size="xs"
          fullWidth
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
                disabled={!saveAsName.trim()}
              >
                {t("save")}
              </Button>
            </Group>
          </Stack>
        )}
        <Button size="xs" fullWidth onClick={props.setDefaultLayout}>
          {t("setDefault")}
        </Button>
        <Group gap="xs" align="end" wrap="nowrap">
          <Button
            size="xs"
            variant="light"
            fullWidth
            onClick={props.exportLayout}
          >
            {t("export")}
          </Button>
          <Button
            size="xs"
            variant="light"
            fullWidth
            onClick={() =>
              document.getElementById("import-layout-input")?.click()
            }
          >
            {t("import")}
          </Button>
        </Group>
        <input
          id="import-layout-input"
          type="file"
          accept=".json"
          hidden
          onChange={props.importLayout}
        />
        {props.status && (
          <Text size="xs" c={props.status.kind === "error" ? "red" : "teal"}>
            {props.status.message}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
