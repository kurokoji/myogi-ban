import { Group, NumberInput, Switch } from "@mantine/core";
import type React from "react";
import { useTranslation } from "react-i18next";
import { resolveDefaultButtonAppearance } from "../../button-appearance";
import type { EditorLayoutUpdater } from "../../editor-helpers";
import { numericValue } from "../../editor-helpers";
import type { Layout } from "../../types";
import { ColorInput } from "./EditorInputs";

interface DefaultButtonTextSettingsProps {
  layout: Layout;
  updateLayout: EditorLayoutUpdater;
}

export function DefaultButtonTextSettings({
  layout,
  updateLayout,
}: DefaultButtonTextSettingsProps): React.ReactElement {
  const { t } = useTranslation();
  const appearance = resolveDefaultButtonAppearance(layout.defaultbuttons);

  return (
    <>
      <div className="control row default-button-text-control">
        <ColorInput
          label={t("textColor")}
          value={appearance.textColor}
          onChange={(event) =>
            updateLayout((next) => {
              next.defaultbuttons.cssTextColor = event.target.value;
            })
          }
        />
        <NumberInput
          size="xs"
          label={t("textSize")}
          min={1}
          max={200}
          step={1}
          value={numericValue(appearance.textSize)}
          onChange={(value) =>
            updateLayout((next) => {
              next.defaultbuttons.cssTextSize = String(value ?? 14);
            })
          }
        />
      </div>
      <Group gap="xs" className="default-button-text-control">
        <Switch
          size="sm"
          label={t("textBold")}
          checked={appearance.textBold}
          onChange={(event) =>
            updateLayout((next) => {
              next.defaultbuttons.cssTextBold = event.target.checked;
            })
          }
        />
        <Switch
          size="sm"
          label={t("textItalic")}
          checked={appearance.textItalic}
          onChange={(event) =>
            updateLayout((next) => {
              next.defaultbuttons.cssTextItalic = event.target.checked;
            })
          }
        />
      </Group>
      <Group gap="xs" align="end" className="default-button-text-control">
        <Switch
          size="sm"
          label={t("textOutline")}
          checked={appearance.textOutline}
          onChange={(event) =>
            updateLayout((next) => {
              next.defaultbuttons.cssTextOutline = event.target.checked;
            })
          }
        />
        {appearance.textOutline && (
          <ColorInput
            label={t("textOutlineColor")}
            value={appearance.textOutlineColor}
            onChange={(event) =>
              updateLayout((next) => {
                next.defaultbuttons.cssTextOutlineColor = event.target.value;
              })
            }
          />
        )}
      </Group>
    </>
  );
}
