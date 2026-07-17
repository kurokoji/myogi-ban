import { Stack } from "@mantine/core";
import { type ReactNode, useState } from "react";

const BUTTON_ADVANCED_SETTINGS_STORAGE_KEY = "button-advanced-settings-open";

interface ButtonSettingsStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface SectionProps {
  children: ReactNode;
}

interface AdvancedSectionProps extends SectionProps {
  label: ReactNode;
  storage?: ButtonSettingsStorage;
}

export function DefaultButtonSettings({ children }: SectionProps) {
  return <Stack gap="xs">{children}</Stack>;
}
export function SelectedButtonSettings({ children }: SectionProps) {
  return <Stack gap="xs">{children}</Stack>;
}
export function ButtonImageSettings({ children }: SectionProps) {
  return <>{children}</>;
}
export function ButtonAppearanceSettings({ children }: SectionProps) {
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
