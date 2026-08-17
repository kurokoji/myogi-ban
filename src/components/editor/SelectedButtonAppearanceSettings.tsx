import { Group, Switch } from "@mantine/core";
import type React from "react";
import { useTranslation } from "react-i18next";
import {
  inheritsDefaultFlag,
  inheritsDefaultText,
  resolveButtonAppearance,
} from "../../button-appearance";
import type {
  EditorLayoutUpdater,
  ImageUploadTarget,
} from "../../editor-helpers";
import type { ButtonShape, Layout } from "../../types";
import { ButtonBorderColorControls } from "./ButtonBorderColorControls";
import { ColorInput } from "./EditorInputs";
import { ImageSelectButton } from "./ImageSelectButton";
import {
  InheritedNumberInput,
  InheritedSelect,
  InheritedTextInput,
} from "./InheritedInputs";

interface SelectedButtonAppearanceSettingsProps {
  layout: Layout;
  index: number;
  selectedButtonIndexes: number[];
  updateSelectedButtons: EditorLayoutUpdater;
  openImagePicker: (target: ImageUploadTarget) => void;
}

export function SelectedButtonAppearanceSettings({
  layout,
  index,
  selectedButtonIndexes,
  updateSelectedButtons,
  openImagePicker,
}: SelectedButtonAppearanceSettingsProps): React.ReactElement {
  const { t } = useTranslation();
  const defaults = layout.defaultbuttons;
  const button = layout.buttons[index];
  const appearance = resolveButtonAppearance(button, defaults);
  const inherited = t("inheritDefault");

  return (
    <>
      <Group gap="xs" className="selected-button-appearance-control">
        <Switch
          size="sm"
          label={t("useCssButton")}
          description={
            inheritsDefaultFlag(button?.useCss, defaults.useCss)
              ? inherited
              : undefined
          }
          checked={!appearance.useCss}
          onChange={(event) =>
            updateSelectedButtons((next) => {
              next.buttons[index].useCss = !event.target.checked;
            })
          }
        />
      </Group>
      {appearance.useCss && (
        <>
          <div className="control row selected-button-appearance-control">
            <ColorInput
              label={t("colorNormal")}
              description={
                inheritsDefaultText(button?.cssColor, defaults.cssColor)
                  ? inherited
                  : undefined
              }
              value={appearance.color}
              onChange={(event) =>
                updateSelectedButtons((next) => {
                  next.buttons[index].cssColor = event.target.value;
                })
              }
            />
            <ColorInput
              label={t("colorPressed")}
              description={
                inheritsDefaultText(
                  button?.cssPressedColor,
                  defaults.cssPressedColor,
                )
                  ? inherited
                  : undefined
              }
              value={appearance.pressedColor}
              onChange={(event) =>
                updateSelectedButtons((next) => {
                  next.buttons[index].cssPressedColor = event.target.value;
                })
              }
            />
          </div>
          <ButtonBorderColorControls
            className="selected-button-appearance-control"
            matchesColor={appearance.borderMatchesColor}
            matchesColorDescription={
              inheritsDefaultFlag(button?.cssBorderMatchesColor)
                ? inherited
                : undefined
            }
            borderColor={appearance.borderColor}
            borderColorDescription={
              inheritsDefaultText(
                button?.cssBorderColor,
                defaults.cssBorderColor,
              )
                ? inherited
                : undefined
            }
            pressedBorderColor={appearance.pressedBorderColor}
            pressedBorderColorDescription={
              inheritsDefaultText(
                button?.cssPressedBorderColor,
                defaults.cssPressedBorderColor,
              )
                ? inherited
                : undefined
            }
            onMatchesColorChange={(matches) =>
              updateSelectedButtons((next) => {
                next.buttons[index].cssBorderMatchesColor = matches;
              })
            }
            onBorderColorChange={(color) =>
              updateSelectedButtons((next) => {
                next.buttons[index].cssBorderColor = color;
              })
            }
            onPressedBorderColorChange={(color) =>
              updateSelectedButtons((next) => {
                next.buttons[index].cssPressedBorderColor = color;
              })
            }
          />
          <div className="control row selected-button-appearance-control">
            <InheritedSelect
              size="xs"
              label={t("buttonShape")}
              value={button?.cssShape}
              defaultValue={defaults.cssShape}
              fallbackValue="circle"
              onChange={(event) =>
                updateSelectedButtons((next) => {
                  if (event.target.value === "") {
                    delete next.buttons[index].cssShape;
                  } else {
                    next.buttons[index].cssShape = event.target
                      .value as ButtonShape;
                  }
                })
              }
              data={[
                { value: "", label: inherited },
                { value: "circle", label: t("shapeCircle") },
                { value: "pill", label: t("shapePill") },
                { value: "rounded", label: t("shapeRounded") },
                { value: "square", label: t("shapeSquare") },
              ]}
            />
            <InheritedNumberInput
              size="xs"
              label={t("transition")}
              min={0}
              max={1}
              step={0.01}
              value={button?.cssTransition}
              defaultValue={defaults.cssTransition}
              fallbackValue="0.02"
              onChange={(value) =>
                updateSelectedButtons((next) => {
                  next.buttons[index].cssTransition = String(value ?? 0.02);
                })
              }
              placeholder={defaults.cssTransition || "0.02"}
            />
          </div>
          <InheritedSelect
            size="xs"
            label={t("easing")}
            className="selected-button-appearance-control"
            value={button?.cssEasing}
            defaultValue={defaults.cssEasing}
            fallbackValue="ease"
            onChange={(event) =>
              updateSelectedButtons((next) => {
                if (event.target.value === "") {
                  delete next.buttons[index].cssEasing;
                } else {
                  next.buttons[index].cssEasing = event.target.value;
                }
              })
            }
            data={[
              { value: "", label: inherited },
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
            className="selected-button-appearance-control"
          >
            <InheritedTextInput
              size="xs"
              label={t("releasedImage")}
              value={button?.img}
              defaultValue={defaults.img}
              onChange={(event) =>
                updateSelectedButtons((next) => {
                  next.buttons[index].img = event.target.value;
                })
              }
              placeholder={defaults.img || "released.png"}
              className="grow"
            />
            <ImageSelectButton
              onClick={() =>
                openImagePicker({
                  type: "button",
                  indexes: selectedButtonIndexes,
                  state: "released",
                })
              }
            />
          </Group>
          <Group
            gap="xs"
            align="end"
            wrap="nowrap"
            className="selected-button-appearance-control"
          >
            <InheritedTextInput
              size="xs"
              label={t("pressedImage")}
              value={button?.imgp}
              defaultValue={defaults.imgp}
              onChange={(event) =>
                updateSelectedButtons((next) => {
                  next.buttons[index].imgp = event.target.value;
                })
              }
              placeholder={defaults.imgp || "pressed.png"}
              className="grow"
            />
            <ImageSelectButton
              onClick={() =>
                openImagePicker({
                  type: "button",
                  indexes: selectedButtonIndexes,
                  state: "pressed",
                })
              }
            />
          </Group>
        </>
      )}
    </>
  );
}
