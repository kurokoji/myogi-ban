import { Group, Switch, TextInput } from "@mantine/core";
import type React from "react";
import { useTranslation } from "react-i18next";
import {
  inheritsDefaultFlag,
  inheritsDefaultText,
  resolveButtonAppearance,
} from "../../button-appearance";
import type { EditorLayoutUpdater } from "../../editor-helpers";
import type { Layout } from "../../types";
import { ColorInput } from "./EditorInputs";
import { InheritedNumberInput } from "./InheritedInputs";

interface SelectedButtonTextSettingsProps {
  layout: Layout;
  index: number;
  updateSelectedButtons: EditorLayoutUpdater;
}

export function SelectedButtonTextSettings({
  layout,
  index,
  updateSelectedButtons,
}: SelectedButtonTextSettingsProps): React.ReactElement {
  const { t } = useTranslation();
  const defaults = layout.defaultbuttons;
  const button = layout.buttons[index];
  const appearance = resolveButtonAppearance(button, defaults);
  const inherited = t("inheritDefault");

  return (
    <>
      <TextInput
        size="xs"
        label={t("buttonText")}
        className="selected-button-text-control"
        value={button?.text ?? ""}
        onChange={(event) =>
          updateSelectedButtons((next) => {
            next.buttons[index].text = event.target.value;
          })
        }
      />
      <div className="control row selected-button-text-control">
        <ColorInput
          label={t("textColor")}
          description={
            inheritsDefaultText(button?.cssTextColor, defaults.cssTextColor)
              ? inherited
              : undefined
          }
          value={appearance.textColor}
          onChange={(event) =>
            updateSelectedButtons((next) => {
              next.buttons[index].cssTextColor = event.target.value;
            })
          }
        />
        <InheritedNumberInput
          size="xs"
          label={t("textSize")}
          min={1}
          max={200}
          step={1}
          value={button?.cssTextSize}
          defaultValue={defaults.cssTextSize}
          fallbackValue="14"
          onChange={(value) =>
            updateSelectedButtons((next) => {
              next.buttons[index].cssTextSize = String(value ?? 14);
            })
          }
          placeholder={defaults.cssTextSize || "14"}
        />
      </div>
      <Group gap="xs" className="selected-button-text-control">
        <Switch
          size="sm"
          label={t("textBold")}
          description={
            inheritsDefaultFlag(button?.cssTextBold) ? inherited : undefined
          }
          checked={appearance.textBold}
          onChange={(event) =>
            updateSelectedButtons((next) => {
              next.buttons[index].cssTextBold = event.target.checked;
            })
          }
        />
        <Switch
          size="sm"
          label={t("textItalic")}
          description={
            inheritsDefaultFlag(button?.cssTextItalic) ? inherited : undefined
          }
          checked={appearance.textItalic}
          onChange={(event) =>
            updateSelectedButtons((next) => {
              next.buttons[index].cssTextItalic = event.target.checked;
            })
          }
        />
      </Group>
      <Group gap="xs" align="end" className="selected-button-text-control">
        <Switch
          size="sm"
          label={t("textOutline")}
          description={
            inheritsDefaultFlag(button?.cssTextOutline) ? inherited : undefined
          }
          checked={appearance.textOutline}
          onChange={(event) =>
            updateSelectedButtons((next) => {
              next.buttons[index].cssTextOutline = event.target.checked;
            })
          }
        />
        {appearance.textOutline && (
          <ColorInput
            label={t("textOutlineColor")}
            className="grow"
            description={
              inheritsDefaultText(
                button?.cssTextOutlineColor,
                defaults.cssTextOutlineColor,
              )
                ? inherited
                : undefined
            }
            value={appearance.textOutlineColor}
            onChange={(event) =>
              updateSelectedButtons((next) => {
                next.buttons[index].cssTextOutlineColor = event.target.value;
              })
            }
          />
        )}
      </Group>
      <InheritedNumberInput
        size="xs"
        label={t("textRotation")}
        className="selected-button-text-control"
        min={-180}
        max={180}
        step={1}
        value={button?.cssTextRotation}
        defaultValue={defaults.cssTextRotation}
        fallbackValue="0"
        onChange={(value) =>
          updateSelectedButtons((next) => {
            next.buttons[index].cssTextRotation = String(value ?? 0);
          })
        }
      />
    </>
  );
}
