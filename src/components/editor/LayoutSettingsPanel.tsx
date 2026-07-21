import {
  Button,
  Group,
  Menu,
  NativeSelect,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import {
  IconChevronDown,
  IconDownload,
  IconStar,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import type { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import type { LayoutEntry, OperationStatus } from "../../types";
import {
  type LayoutImportPreview,
  LayoutImportPreviewModal,
} from "./LayoutImportPreviewModal";
import { LayoutSaveControls } from "./LayoutSaveControls";

interface LayoutSettingsPanelProps {
  layoutNames: LayoutEntry[];
  selectedLayout: string;
  layoutName: string;
  currentBuiltin: boolean;
  isDefaultLayout: boolean;
  isDirty: boolean;
  status: OperationStatus;
  openLayout: (value: string) => void;
  saveLayout: () => void;
  saveLayoutAs: (name: string) => Promise<boolean>;
  deleteLayout: () => void;
  setDefaultLayout: () => void;
  exportLayout: () => void;
  importLayout: (event: ChangeEvent<HTMLInputElement>) => void;
  pendingImport?: LayoutImportPreview | null;
  importInProgress?: boolean;
  confirmImport?: () => void;
  cancelImport?: () => void;
}

export function LayoutSettingsPanel(
  props: LayoutSettingsPanelProps,
): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <LayoutImportPreviewModal
        preview={props.pendingImport ?? null}
        inProgress={props.importInProgress ?? false}
        hasUnsavedChanges={props.isDirty}
        onConfirm={() => props.confirmImport?.()}
        onCancel={() => props.cancelImport?.()}
      />
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
          <LayoutSaveControls
            layoutNames={props.layoutNames}
            layoutName={props.layoutName}
            currentBuiltin={props.currentBuiltin}
            saveLayout={props.saveLayout}
            saveLayoutAs={props.saveLayoutAs}
          />
          <Button
            size="xs"
            variant={props.isDefaultLayout ? "filled" : "light"}
            color="yellow"
            fullWidth
            leftSection={<IconStar size={16} />}
            onClick={props.setDefaultLayout}
            disabled={props.isDefaultLayout}
          >
            {t(props.isDefaultLayout ? "defaultLayout" : "setDefault")}
          </Button>
          <Menu
            keepMounted
            position="bottom-end"
            transitionProps={{ duration: 0 }}
            withinPortal={false}
          >
            <Menu.Target>
              <Button
                size="xs"
                variant="default"
                fullWidth
                rightSection={<IconChevronDown size={14} />}
              >
                {t("moreActions")}
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconDownload size={16} />}
                onClick={props.exportLayout}
              >
                {t("export")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconUpload size={16} />}
                onClick={() =>
                  document.getElementById("import-layout-input")?.click()
                }
              >
                {t("import")}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={props.deleteLayout}
                disabled={props.currentBuiltin}
              >
                {t("deleteLayout")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
          <input
            id="import-layout-input"
            type="file"
            accept=".myogi,.json"
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
    </>
  );
}
