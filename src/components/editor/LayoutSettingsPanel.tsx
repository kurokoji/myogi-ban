import {
  Button,
  Group,
  NativeSelect,
  Paper,
  Stack,
  TextInput,
  Title,
} from "@mantine/core";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutEntry } from "../../types";

interface LayoutSettingsPanelProps {
  layoutNames: LayoutEntry[];
  selectedLayout: string;
  layoutName: string;
  setSelectedLayout: (value: string) => void;
  setLayoutName: (value: string) => void;
  loadLayout: () => void;
  saveLayout: () => void;
  setDefaultLayout: () => void;
  exportLayout: () => void;
  importLayout: (event: ChangeEvent<HTMLInputElement>) => void;
}

export function LayoutSettingsPanel(
  props: LayoutSettingsPanelProps,
): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t("layout")}</Title>
        <Group gap="xs" align="end" wrap="nowrap">
          <NativeSelect
            size="xs"
            value={props.selectedLayout}
            onChange={(event) => props.setSelectedLayout(event.target.value)}
            data={props.layoutNames.map((entry) => ({
              value: `${entry.name}:${entry.builtin ? "builtin" : "user"}`,
              label: entry.builtin
                ? `${entry.name} (${t("builtIn")})`
                : entry.name,
            }))}
            className="grow"
          />
          <Button size="xs" variant="light" onClick={props.loadLayout}>
            {t("load")}
          </Button>
        </Group>
        <Group gap="xs" align="end" wrap="nowrap">
          <TextInput
            size="xs"
            value={props.layoutName}
            onChange={(event) => props.setLayoutName(event.target.value)}
            placeholder={t("layoutNamePlaceholder")}
            className="grow"
          />
          <Button size="xs" onClick={props.saveLayout}>
            {t("save")}
          </Button>
        </Group>
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
      </Stack>
    </Paper>
  );
}
