import { Stack } from "@mantine/core";
import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
}

interface AdvancedSectionProps extends SectionProps {
  label: ReactNode;
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
}: AdvancedSectionProps) {
  return (
    <details className="button-advanced-settings">
      <summary>{label}</summary>
      <Stack gap="xs" pt="xs">
        {children}
      </Stack>
    </details>
  );
}
