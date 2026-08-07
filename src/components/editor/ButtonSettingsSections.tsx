import { Group, Paper, Stack, Text, Title } from "@mantine/core";
import { type ReactNode, useState } from "react";

const BUTTON_ADVANCED_SETTINGS_STORAGE_KEY = "button-advanced-settings-open";

interface ButtonSettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface ChildrenProps {
  children: ReactNode;
}

interface SectionProps extends ChildrenProps {
  title: ReactNode;
  hint: ReactNode;
  action?: ReactNode;
}

interface AdvancedSectionProps extends ChildrenProps {
  label: ReactNode;
  storage?: ButtonSettingsStorage;
}

function ButtonSettingsScope({
  children,
  title,
  hint,
  action,
  className,
}: SectionProps & { className: string }) {
  return (
    <Paper withBorder p="xs" className={`button-settings-card ${className}`}>
      <Stack gap="xs">
        <Group
          justify="space-between"
          align="start"
          wrap="wrap"
          className="button-settings-card-header"
        >
          <div className="button-settings-card-heading">
            <Title order={4} size="sm">
              {title}
            </Title>
            <Text size="xs" c="dimmed">
              {hint}
            </Text>
          </div>
          {action && (
            <div className="button-settings-card-action">{action}</div>
          )}
        </Group>
        {children}
      </Stack>
    </Paper>
  );
}

export function DefaultButtonSettings(props: SectionProps) {
  return (
    <ButtonSettingsScope {...props} className="button-settings-card-default" />
  );
}
export function SelectedButtonSettings(props: SectionProps) {
  return (
    <ButtonSettingsScope {...props} className="button-settings-card-selected" />
  );
}
export function ButtonImageSettings({ children }: ChildrenProps) {
  return <>{children}</>;
}
export function ButtonAppearanceSettings({ children }: ChildrenProps) {
  return <>{children}</>;
}

export function ButtonAdvancedSettings({
  children,
  label,
  storage = window.localStorage,
}: AdvancedSectionProps) {
  const [open, setOpen] = useState(
    () => storage.getItem(BUTTON_ADVANCED_SETTINGS_STORAGE_KEY) === "true",
  );

  return (
    <details
      className="button-advanced-settings"
      open={open}
      onToggle={(event) => {
        const nextOpen = event.currentTarget.open;
        setOpen(nextOpen);
        storage.setItem(BUTTON_ADVANCED_SETTINGS_STORAGE_KEY, String(nextOpen));
      }}
    >
      <summary>{label}</summary>
      <Stack gap="xs" pt="xs">
        {children}
      </Stack>
    </details>
  );
}
