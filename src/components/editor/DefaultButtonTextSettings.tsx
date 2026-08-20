import { NumberInput } from "@mantine/core";
import type React from "react";
import { useTranslation } from "react-i18next";
import { resolveDefaultButtonAppearance } from "../../button-appearance";
import type { EditorLayoutUpdater } from "../../editor-helpers";
import { numericValue } from "../../editor-helpers";
import type { Layout } from "../../types";
import { ColorInput, LabeledSwitch } from "./EditorInputs";
import { TextOutlineControls } from "./TextOutlineControls";

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
      <div className="control row align-top default-button-text-control">
        <LabeledSwitch
          label={t("textBold")}
          checked={appearance.textBold}
          onChange={(event) =>
            updateLayout((next) => {
              next.defaultbuttons.cssTextBold = event.target.checked;
            })
          }
        />
        <LabeledSwitch
          label={t("textItalic")}
          checked={appearance.textItalic}
          onChange={(event) =>
            updateLayout((next) => {
              next.defaultbuttons.cssTextItalic = event.target.checked;
            })
          }
        />
      </div>
      <TextOutlineControls
        className="default-button-text-control"
        outline={appearance.textOutline}
        color={appearance.textOutlineColor}
        onOutlineChange={(outline) =>
          updateLayout((next) => {
            next.defaultbuttons.cssTextOutline = outline;
          })
        }
        onColorChange={(color) =>
          updateLayout((next) => {
            next.defaultbuttons.cssTextOutlineColor = color;
          })
        }
      />
      <NumberInput
        size="xs"
        label={t("textRotation")}
        className="default-button-text-control"
        min={-180}
        max={180}
        step={1}
        value={numericValue(appearance.textRotation)}
        onChange={(value) =>
          updateLayout((next) => {
            next.defaultbuttons.cssTextRotation = String(value ?? 0);
          })
        }
      />
    </>
  );
}
