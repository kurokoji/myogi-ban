import { Stack } from "@mantine/core";
import type { ReactNode } from "react";

interface SectionProps {
  children: ReactNode;
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
