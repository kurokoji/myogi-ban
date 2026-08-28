import { Group, Paper, Stack, Text, Title } from "@mantine/core";
import { type ReactNode, useEffect, useRef, useState } from "react";

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
  /**
   * When this changes to a non-null value, the section opens. Used to reveal
   * the settings automatically once a button or stick is selected.
   */
  revealKey?: string | number | null;
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
  revealKey = null,
}: AdvancedSectionProps) {
  const [open, setOpen] = useState(
    () =>
      revealKey !== null ||
      storage.getItem(BUTTON_ADVANCED_SETTINGS_STORAGE_KEY) === "true",
  );

  const lastRevealKey = useRef(revealKey);
  useEffect(() => {
    if (revealKey === lastRevealKey.current) return;
    lastRevealKey.current = revealKey;
    if (revealKey === null) return;
    setOpen(true);
    storage.setItem(BUTTON_ADVANCED_SETTINGS_STORAGE_KEY, "true");
  }, [revealKey, storage]);

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
