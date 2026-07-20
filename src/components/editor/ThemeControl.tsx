import {
  type MantineColorScheme,
  SegmentedControl,
  useMantineColorScheme,
  VisuallyHidden,
} from "@mantine/core";
import { IconDeviceDesktop, IconMoon, IconSun } from "@tabler/icons-react";
import type React from "react";
import { useTranslation } from "react-i18next";

interface ThemeOptionProps {
  label: string;
  children: React.ReactNode;
}

function ThemeOption({ label, children }: ThemeOptionProps) {
  return (
    <span className="theme-option-icon" title={label}>
      {children}
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

export function ThemeControl(): React.ReactElement {
  const { t } = useTranslation();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  return (
    <SegmentedControl
      size="xs"
      value={colorScheme}
      onChange={(value) => setColorScheme(value as MantineColorScheme)}
      data={[
        {
          value: "light",
          label: (
            <ThemeOption label={t("themeLight")}>
              <IconSun size={15} />
            </ThemeOption>
          ),
        },
        {
          value: "auto",
          label: (
            <ThemeOption label={t("themeAuto")}>
              <IconDeviceDesktop size={15} />
            </ThemeOption>
          ),
        },
        {
          value: "dark",
          label: (
            <ThemeOption label={t("themeDark")}>
              <IconMoon size={15} />
            </ThemeOption>
          ),
        },
      ]}
    />
  );
}
