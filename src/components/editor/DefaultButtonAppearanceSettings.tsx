import { Group, NativeSelect, NumberInput, TextInput } from "@mantine/core";
import type React from "react";
import { useTranslation } from "react-i18next";
import { resolveDefaultButtonAppearance } from "../../button-appearance";
import type {
  EditorLayoutUpdater,
  ImageUploadTarget,
} from "../../editor-helpers";
import type { ButtonShape, Layout } from "../../types";
import { ButtonBorderColorControls } from "./ButtonBorderColorControls";
import { ColorInput, LabeledSwitch } from "./EditorInputs";
import { ImageSelectButton } from "./ImageSelectButton";

interface DefaultButtonAppearanceSettingsProps {
  layout: Layout;
  updateLayout: EditorLayoutUpdater;
  openImagePicker: (target: ImageUploadTarget) => void;
}

export function DefaultButtonAppearanceSettings({
  layout,
  updateLayout,
  openImagePicker,
}: DefaultButtonAppearanceSettingsProps): React.ReactElement {
  const { t } = useTranslation();
  const appearance = resolveDefaultButtonAppearance(layout.defaultbuttons);

  return (
    <>
      <LabeledSwitch
        label={t("useCssButton")}
        className="default-button-appearance-control"
        checked={!appearance.useCss}
        onChange={(event) =>
          updateLayout((next) => {
            next.defaultbuttons.useCss = !event.target.checked;
          })
        }
      />
      {appearance.useCss && (
        <>
          <div className="control row default-button-appearance-control">
            <ColorInput
              label={t("colorNormal")}
              value={appearance.color}
              onChange={(event) =>
                updateLayout((next) => {
                  next.defaultbuttons.cssColor = event.target.value;
                })
              }
            />
            <ColorInput
              label={t("colorPressed")}
              value={appearance.pressedColor}
              onChange={(event) =>
                updateLayout((next) => {
                  next.defaultbuttons.cssPressedColor = event.target.value;
                })
              }
            />
          </div>
          <ButtonBorderColorControls
            className="default-button-appearance-control"
            matchesColor={appearance.borderMatchesColor}
            borderColor={appearance.borderColor}
            pressedBorderColor={appearance.pressedBorderColor}
            onMatchesColorChange={(matches) =>
              updateLayout((next) => {
                next.defaultbuttons.cssBorderMatchesColor = matches;
              })
            }
            onBorderColorChange={(color) =>
              updateLayout((next) => {
                next.defaultbuttons.cssBorderColor = color;
              })
            }
            onPressedBorderColorChange={(color) =>
              updateLayout((next) => {
                next.defaultbuttons.cssPressedBorderColor = color;
              })
            }
          />
          <div className="control row default-button-appearance-control">
            <NativeSelect
              size="xs"
              label={t("buttonShape")}
              value={appearance.shape}
              onChange={(event) =>
                updateLayout((next) => {
                  const previousShape =
                    next.defaultbuttons.cssShape ?? "circle";
                  next.defaultbuttons.cssShape = event.target
                    .value as ButtonShape;
                  for (const button of next.buttons) {
                    if ((button.cssShape ?? previousShape) === previousShape) {
                      delete button.cssShape;
                    }
                  }
                })
              }
              data={[
                { value: "circle", label: t("shapeCircle") },
                { value: "pill", label: t("shapePill") },
                { value: "rounded", label: t("shapeRounded") },
                { value: "square", label: t("shapeSquare") },
              ]}
            />
            <NumberInput
              size="xs"
              label={t("transition")}
              min={0}
              max={1}
              step={0.01}
              value={parseFloat(appearance.transition)}
              onChange={(value) =>
                updateLayout((next) => {
                  next.defaultbuttons.cssTransition = String(value ?? 0.02);
                })
              }
            />
          </div>
          <NativeSelect
            size="xs"
            label={t("easing")}
            className="default-button-appearance-control"
            value={appearance.easing}
            onChange={(event) =>
              updateLayout((next) => {
                next.defaultbuttons.cssEasing = event.target.value;
              })
            }
            data={[
              { value: "ease", label: "ease" },
              { value: "linear", label: "linear" },
              { value: "ease-in", label: "ease-in" },
              { value: "ease-out", label: "ease-out" },
              { value: "ease-in-out", label: "ease-in-out" },
            ]}
          />
        </>
      )}
      {!appearance.useCss && (
        <>
          <Group
            gap="xs"
            align="end"
            wrap="nowrap"
            className="default-button-appearance-control"
          >
            <TextInput
              size="xs"
              label={t("defaultReleasedImage")}
              value={layout.defaultbuttons.img}
              onChange={(event) =>
                updateLayout((next) => {
                  next.defaultbuttons.img = event.target.value;
                })
              }
              placeholder="released.png"
              className="grow"
            />
            <ImageSelectButton
              onClick={() =>
                openImagePicker({ type: "defaultButton", state: "released" })
              }
            />
          </Group>
          <Group
            gap="xs"
            align="end"
            wrap="nowrap"
            className="default-button-appearance-control"
          >
            <TextInput
              size="xs"
              label={t("defaultPressedImage")}
              value={layout.defaultbuttons.imgp}
              onChange={(event) =>
                updateLayout((next) => {
                  next.defaultbuttons.imgp = event.target.value;
                })
              }
              placeholder="pressed.png"
              className="grow"
            />
            <ImageSelectButton
              onClick={() =>
                openImagePicker({ type: "defaultButton", state: "pressed" })
              }
            />
          </Group>
        </>
      )}
    </>
  );
}
