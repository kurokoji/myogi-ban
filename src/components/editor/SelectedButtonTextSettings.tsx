import { TextInput } from "@mantine/core";
import type React from "react";
import { useTranslation } from "react-i18next";
import {
  inheritsDefaultFlag,
  inheritsDefaultText,
  resolveButtonAppearance,
} from "../../button-appearance";
import type { EditorLayoutUpdater } from "../../editor-helpers";
import type { Layout } from "../../types";
import { ColorInput, LabeledSwitch } from "./EditorInputs";
import { InheritedNumberInput } from "./InheritedInputs";
import { TextOutlineControls } from "./TextOutlineControls";

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
      <div className="control row align-top selected-button-text-control">
        <LabeledSwitch
          label={t("textBold")}
          description={
            inheritsDefaultFlag(button?.cssTextBold) ? inherited : undefined
          }
          descriptionPlacement="inline"
          checked={appearance.textBold}
          onChange={(event) =>
            updateSelectedButtons((next) => {
              next.buttons[index].cssTextBold = event.target.checked;
            })
          }
        />
        <LabeledSwitch
          label={t("textItalic")}
          description={
            inheritsDefaultFlag(button?.cssTextItalic) ? inherited : undefined
          }
          descriptionPlacement="inline"
          checked={appearance.textItalic}
          onChange={(event) =>
            updateSelectedButtons((next) => {
              next.buttons[index].cssTextItalic = event.target.checked;
            })
          }
        />
      </div>
      <TextOutlineControls
        className="selected-button-text-control"
        outline={appearance.textOutline}
        outlineDescription={
          inheritsDefaultFlag(button?.cssTextOutline) ? inherited : undefined
        }
        color={appearance.textOutlineColor}
        colorDescription={
          inheritsDefaultText(
            button?.cssTextOutlineColor,
            defaults.cssTextOutlineColor,
          )
            ? inherited
            : undefined
        }
        onOutlineChange={(outline) =>
          updateSelectedButtons((next) => {
            next.buttons[index].cssTextOutline = outline;
          })
        }
        onColorChange={(color) =>
          updateSelectedButtons((next) => {
            next.buttons[index].cssTextOutlineColor = color;
          })
        }
      />
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
