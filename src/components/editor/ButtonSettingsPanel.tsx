import {
  Button,
  Group,
  NativeSelect,
  NumberInput,
  Paper,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { MAX_VISIBLE_BUTTONS } from "../../app-constants";
import { resetButtonToDefaults } from "../../button-settings";
import {
  type AssigningTarget,
  type EditorLayoutUpdater,
  type ImageUploadTarget,
  isStickAssignmentTarget,
  numericValue,
} from "../../editor-helpers";
import type { ButtonShape, Layout } from "../../types";
import {
  ButtonAdvancedSettings,
  DefaultButtonSettings,
  SelectedButtonSettings,
} from "./ButtonSettingsSections";
import { ColorInput } from "./EditorInputs";
import { ImageSelectButton } from "./ImageSelectButton";
import {
  InheritedNumberInput,
  InheritedSelect,
  InheritedTextInput,
} from "./InheritedInputs";
import { InheritedSizeInputs } from "./InheritedSizeInputs";
import { InspectorTabs } from "./InspectorTabs";
import { LinkedSizeInputs } from "./LinkedSizeInputs";
import { PositionInputs } from "./PositionInputs";

interface ButtonSettingsPanelProps {
  layout: Layout;
  assigningTarget: AssigningTarget;
  assignmentName: string;
  selectedButtonIndex: number | null;
  selectedButtonIndexes: number[];
  updateLayout: EditorLayoutUpdater;
  updateSelectedButtons: EditorLayoutUpdater;
  onSelectedButtonChange: (index: number | null) => void;
  onAddButton: () => void;
  onDeleteSelectedButtons: () => void;
  openImagePicker: (target: ImageUploadTarget) => void;
  cancelAssignment: () => void;
  aspectRatioLinked?: boolean;
  onAspectRatioLinkedChange?: (linked: boolean) => void;
}

export function ButtonSettingsPanel(
  props: ButtonSettingsPanelProps,
): React.ReactElement {
  const { t } = useTranslation();
  const { layout, selectedButtonIndex, updateLayout } = props;

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t("buttons")}</Title>
        <Group gap="xs" justify="space-between">
          <Text size="xs" fw={600}>
            {t("buttonCount", { count: layout.totalbuttonshow })}
          </Text>
          <Button
            size="xs"
            variant="light"
            onClick={props.onAddButton}
            disabled={layout.totalbuttonshow >= MAX_VISIBLE_BUTTONS}
          >
            {t("addButton")}
          </Button>
        </Group>
        <NativeSelect
          size="xs"
          label={t("editButton")}
          value={
            selectedButtonIndex === null ? "" : String(selectedButtonIndex)
          }
          onChange={(event) =>
            props.onSelectedButtonChange(
              event.target.value === ""
                ? null
                : parseInt(event.target.value, 10),
            )
          }
          data={[
            { value: "", label: t("select") },
            ...Array.from({ length: layout.totalbuttonshow }, (_, index) => ({
              value: String(index),
              label: `${t("buttonLabel")} ${index + 1}`,
            })),
          ]}
        />
        <Button
          size="xs"
          variant="light"
          color="red"
          onClick={props.onDeleteSelectedButtons}
          disabled={props.selectedButtonIndexes.length === 0}
        >
          {t("deleteSelectedButtons", {
            count: props.selectedButtonIndexes.length,
          })}
        </Button>
        <ButtonAdvancedSettings label={t("advancedSettings")}>
          <InspectorTabs
            activeTab={selectedButtonIndex !== null ? "selected" : "default"}
            tabs={[
              {
                value: "default",
                label: t("defaultButtonSettings"),
                content: (
                  <DefaultButtonSettings
                    title={t("defaultButtonSettings")}
                    hint={t("defaultButtonSettingsHint")}
                  >
                    <Switch
                      size="sm"
                      label={t("useCssButton")}
                      checked={!(layout.defaultbuttons.useCss ?? false)}
                      onChange={(event) =>
                        updateLayout((next) => {
                          next.defaultbuttons.useCss = !event.target.checked;
                        })
                      }
                    />
                    {layout.defaultbuttons.useCss && (
                      <div className="control row">
                        <ColorInput
                          label={t("colorNormal")}
                          value={layout.defaultbuttons.cssColor || "#cccccc"}
                          onChange={(event) =>
                            updateLayout((next) => {
                              next.defaultbuttons.cssColor = event.target.value;
                            })
                          }
                        />
                        <ColorInput
                          label={t("colorPressed")}
                          value={
                            layout.defaultbuttons.cssPressedColor || "#999999"
                          }
                          onChange={(event) =>
                            updateLayout((next) => {
                              next.defaultbuttons.cssPressedColor =
                                event.target.value;
                            })
                          }
                        />
                      </div>
                    )}
                    {layout.defaultbuttons.useCss && (
                      <div className="control row">
                        <NativeSelect
                          size="xs"
                          label={t("buttonShape")}
                          value={layout.defaultbuttons.cssShape || "circle"}
                          onChange={(event) =>
                            updateLayout((next) => {
                              const previousShape =
                                next.defaultbuttons.cssShape ?? "circle";
                              next.defaultbuttons.cssShape = event.target
                                .value as ButtonShape;
                              for (const button of next.buttons) {
                                if (
                                  (button.cssShape ?? previousShape) ===
                                  previousShape
                                ) {
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
                          value={parseFloat(
                            layout.defaultbuttons.cssTransition || "0.02",
                          )}
                          onChange={(value) =>
                            updateLayout((next) => {
                              next.defaultbuttons.cssTransition = String(
                                value ?? 0.02,
                              );
                            })
                          }
                        />
                      </div>
                    )}
                    {layout.defaultbuttons.useCss && (
                      <NativeSelect
                        size="xs"
                        label={t("easing")}
                        value={layout.defaultbuttons.cssEasing || "ease"}
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
                    )}
                    {!layout.defaultbuttons.useCss && (
                      <>
                        <Group gap="xs" align="end" wrap="nowrap">
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
                              props.openImagePicker({
                                type: "defaultButton",
                                state: "released",
                              })
                            }
                          />
                        </Group>
                        <Group gap="xs" align="end" wrap="nowrap">
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
                              props.openImagePicker({
                                type: "defaultButton",
                                state: "pressed",
                              })
                            }
                          />
                        </Group>
                      </>
                    )}
                    <Text size="xs" fw={600}>
                      {t("defaultButtonSize")}
                    </Text>
                    <LinkedSizeInputs
                      width={layout.defaultbuttons.w}
                      height={layout.defaultbuttons.h}
                      widthLabel={t("width")}
                      heightLabel={t("height")}
                      fallbackWidth="60"
                      fallbackHeight="60"
                      onChange={(width, height) =>
                        updateLayout((next) => {
                          next.defaultbuttons.w = width;
                          next.defaultbuttons.h = height;
                        })
                      }
                    />
                    <NumberInput
                      size="xs"
                      label={t("rotation")}
                      min={-180}
                      max={180}
                      step={1}
                      value={numericValue(
                        layout.defaultbuttons.rotation || "0",
                      )}
                      onChange={(value) =>
                        updateLayout((next) => {
                          const previousRotation =
                            next.defaultbuttons.rotation ?? "0";
                          next.defaultbuttons.rotation = String(value ?? 0);
                          for (const button of next.buttons) {
                            if (
                              (button.rotation ?? previousRotation) ===
                              previousRotation
                            ) {
                              delete button.rotation;
                            }
                          }
                        })
                      }
                    />
                    <Text size="xs" fw={600}>
                      {t("buttonText")}
                    </Text>
                    <div className="control row">
                      <ColorInput
                        label={t("textColor")}
                        value={layout.defaultbuttons.cssTextColor || "#ffffff"}
                        onChange={(event) =>
                          updateLayout((next) => {
                            next.defaultbuttons.cssTextColor =
                              event.target.value;
                          })
                        }
                      />
                      <NumberInput
                        size="xs"
                        label={t("textSize")}
                        min={1}
                        max={200}
                        step={1}
                        value={numericValue(
                          layout.defaultbuttons.cssTextSize || "14",
                        )}
                        onChange={(value) =>
                          updateLayout((next) => {
                            next.defaultbuttons.cssTextSize = String(
                              value ?? 14,
                            );
                          })
                        }
                      />
                    </div>
                    <Group gap="xs">
                      <Switch
                        size="sm"
                        label={t("textBold")}
                        checked={layout.defaultbuttons.cssTextBold ?? false}
                        onChange={(event) =>
                          updateLayout((next) => {
                            next.defaultbuttons.cssTextBold =
                              event.target.checked;
                          })
                        }
                      />
                      <Switch
                        size="sm"
                        label={t("textItalic")}
                        checked={layout.defaultbuttons.cssTextItalic ?? false}
                        onChange={(event) =>
                          updateLayout((next) => {
                            next.defaultbuttons.cssTextItalic =
                              event.target.checked;
                          })
                        }
                      />
                    </Group>
                    <Group gap="xs" align="end">
                      <Switch
                        size="sm"
                        label={t("textOutline")}
                        checked={layout.defaultbuttons.cssTextOutline ?? false}
                        onChange={(event) =>
                          updateLayout((next) => {
                            next.defaultbuttons.cssTextOutline =
                              event.target.checked;
                          })
                        }
                      />
                      {layout.defaultbuttons.cssTextOutline && (
                        <ColorInput
                          label={t("textOutlineColor")}
                          value={
                            layout.defaultbuttons.cssTextOutlineColor ||
                            "#000000"
                          }
                          onChange={(event) =>
                            updateLayout((next) => {
                              next.defaultbuttons.cssTextOutlineColor =
                                event.target.value;
                            })
                          }
                        />
                      )}
                    </Group>
                    <Button
                      size="xs"
                      variant="light"
                      color="gray"
                      onClick={() =>
                        updateLayout((next) => {
                          next.buttons = next.buttons.map((b) =>
                            resetButtonToDefaults(b, next.defaultbuttons),
                          );
                        })
                      }
                    >
                      {t("resetAllToDefault")}
                    </Button>
                  </DefaultButtonSettings>
                ),
              },
              {
                value: "selected",
                label: t("selectedButtonSettingsEmpty"),
                content: (
                  <SelectedButtonSettings
                    title={
                      props.selectedButtonIndexes.length > 1
                        ? t("selectedButtonsSettings", {
                            count: props.selectedButtonIndexes.length,
                          })
                        : selectedButtonIndex !== null
                          ? t("selectedButtonSettings", {
                              number: selectedButtonIndex + 1,
                            })
                          : t("selectedButtonSettingsEmpty")
                    }
                    hint={t(
                      selectedButtonIndex === null
                        ? "selectButtonForSettings"
                        : "useDefaultWhenBlank",
                    )}
                  >
                    {selectedButtonIndex !== null && (
                      <Stack gap="xs">
                        <TextInput
                          size="xs"
                          label={t("buttonText")}
                          value={
                            layout.buttons[selectedButtonIndex]?.text ?? ""
                          }
                          onChange={(event) =>
                            props.updateSelectedButtons((next) => {
                              next.buttons[selectedButtonIndex].text =
                                event.target.value;
                            })
                          }
                        />
                        <div className="control row">
                          <ColorInput
                            label={t("textColor")}
                            description={
                              !layout.buttons[selectedButtonIndex]
                                ?.cssTextColor ||
                              layout.buttons[selectedButtonIndex]
                                ?.cssTextColor ===
                                layout.defaultbuttons.cssTextColor
                                ? t("inheritDefault")
                                : undefined
                            }
                            value={
                              layout.buttons[selectedButtonIndex]
                                ?.cssTextColor ||
                              layout.defaultbuttons.cssTextColor ||
                              "#ffffff"
                            }
                            onChange={(event) =>
                              props.updateSelectedButtons((next) => {
                                next.buttons[selectedButtonIndex].cssTextColor =
                                  event.target.value;
                              })
                            }
                          />
                          <InheritedNumberInput
                            size="xs"
                            label={t("textSize")}
                            min={1}
                            max={200}
                            step={1}
                            value={
                              layout.buttons[selectedButtonIndex]?.cssTextSize
                            }
                            defaultValue={layout.defaultbuttons.cssTextSize}
                            fallbackValue="14"
                            onChange={(value) =>
                              props.updateSelectedButtons((next) => {
                                next.buttons[selectedButtonIndex].cssTextSize =
                                  String(value ?? 14);
                              })
                            }
                            placeholder={
                              layout.defaultbuttons.cssTextSize || "14"
                            }
                          />
                        </div>
                        <Group gap="xs">
                          <Switch
                            size="sm"
                            label={t("textBold")}
                            description={
                              layout.buttons[selectedButtonIndex]
                                ?.cssTextBold === undefined
                                ? t("inheritDefault")
                                : undefined
                            }
                            checked={
                              layout.buttons[selectedButtonIndex]
                                ?.cssTextBold ??
                              layout.defaultbuttons.cssTextBold ??
                              false
                            }
                            onChange={(event) =>
                              props.updateSelectedButtons((next) => {
                                next.buttons[selectedButtonIndex].cssTextBold =
                                  event.target.checked;
                              })
                            }
                          />
                          <Switch
                            size="sm"
                            label={t("textItalic")}
                            description={
                              layout.buttons[selectedButtonIndex]
                                ?.cssTextItalic === undefined
                                ? t("inheritDefault")
                                : undefined
                            }
                            checked={
                              layout.buttons[selectedButtonIndex]
                                ?.cssTextItalic ??
                              layout.defaultbuttons.cssTextItalic ??
                              false
                            }
                            onChange={(event) =>
                              props.updateSelectedButtons((next) => {
                                next.buttons[
                                  selectedButtonIndex
                                ].cssTextItalic = event.target.checked;
                              })
                            }
                          />
                        </Group>
                        <Group gap="xs" align="end">
                          <Switch
                            size="sm"
                            label={t("textOutline")}
                            description={
                              layout.buttons[selectedButtonIndex]
                                ?.cssTextOutline === undefined
                                ? t("inheritDefault")
                                : undefined
                            }
                            checked={
                              layout.buttons[selectedButtonIndex]
                                ?.cssTextOutline ??
                              layout.defaultbuttons.cssTextOutline ??
                              false
                            }
                            onChange={(event) =>
                              props.updateSelectedButtons((next) => {
                                next.buttons[
                                  selectedButtonIndex
                                ].cssTextOutline = event.target.checked;
                              })
                            }
                          />
                          {(layout.buttons[selectedButtonIndex]
                            ?.cssTextOutline ??
                            layout.defaultbuttons.cssTextOutline ??
                            false) && (
                            <ColorInput
                              label={t("textOutlineColor")}
                              description={
                                !layout.buttons[selectedButtonIndex]
                                  ?.cssTextOutlineColor ||
                                layout.buttons[selectedButtonIndex]
                                  ?.cssTextOutlineColor ===
                                  layout.defaultbuttons.cssTextOutlineColor
                                  ? t("inheritDefault")
                                  : undefined
                              }
                              value={
                                layout.buttons[selectedButtonIndex]
                                  ?.cssTextOutlineColor ||
                                layout.defaultbuttons.cssTextOutlineColor ||
                                "#000000"
                              }
                              onChange={(event) =>
                                props.updateSelectedButtons((next) => {
                                  next.buttons[
                                    selectedButtonIndex
                                  ].cssTextOutlineColor = event.target.value;
                                })
                              }
                            />
                          )}
                        </Group>
                        {props.selectedButtonIndexes.length === 1 && (
                          <PositionInputs
                            x={layout.buttons[selectedButtonIndex]?.x ?? ""}
                            y={layout.buttons[selectedButtonIndex]?.y ?? ""}
                            onXChange={(value) =>
                              updateLayout((next) => {
                                next.buttons[selectedButtonIndex].x = value;
                              })
                            }
                            onYChange={(value) =>
                              updateLayout((next) => {
                                next.buttons[selectedButtonIndex].y = value;
                              })
                            }
                          />
                        )}
                        <Group gap="xs">
                          <Switch
                            size="sm"
                            label={t("useCssButton")}
                            description={
                              layout.buttons[selectedButtonIndex]?.useCss ===
                                undefined ||
                              layout.buttons[selectedButtonIndex]?.useCss ===
                                layout.defaultbuttons.useCss
                                ? t("inheritDefault")
                                : undefined
                            }
                            checked={
                              !(
                                layout.buttons[selectedButtonIndex]?.useCss ??
                                layout.defaultbuttons.useCss ??
                                false
                              )
                            }
                            onChange={(event) =>
                              props.updateSelectedButtons((next) => {
                                next.buttons[selectedButtonIndex].useCss =
                                  !event.target.checked;
                              })
                            }
                          />
                          <Button
                            size="xs"
                            variant="light"
                            color="gray"
                            onClick={() => {
                              props.updateSelectedButtons((next) => {
                                next.buttons[selectedButtonIndex] =
                                  resetButtonToDefaults(
                                    next.buttons[selectedButtonIndex],
                                    next.defaultbuttons,
                                  ); /* {
                      x: next.buttons[selectedButtonIndex].x,
                      y: next.buttons[selectedButtonIndex].y,
                      w: next.defaultbuttons.w,
                      h: next.defaultbuttons.h,
                      img: next.defaultbuttons.img,
                      xp: next.defaultbuttons.xp,
                      yp: next.defaultbuttons.yp,
                      wp: next.defaultbuttons.wp,
                      hp: next.defaultbuttons.hp,
                      imgp: next.defaultbuttons.imgp,
                      rotation: next.defaultbuttons.rotation,
                      useCss: next.defaultbuttons.useCss,
                      cssColor: next.defaultbuttons.cssColor,
                      cssPressedColor: next.defaultbuttons.cssPressedColor,
                      cssTransition: next.defaultbuttons.cssTransition,
                      cssEasing: next.defaultbuttons.cssEasing,
                      cssShape: next.defaultbuttons.cssShape,
                    }; */
                              });
                            }}
                          >
                            {t("resetToDefault")}
                          </Button>
                        </Group>
                      </Stack>
                    )}
                    {selectedButtonIndex !== null &&
                      (layout.buttons[selectedButtonIndex]?.useCss ??
                        layout.defaultbuttons.useCss ??
                        false) && (
                        <div className="control row">
                          <ColorInput
                            label={t("colorNormal")}
                            description={
                              !layout.buttons[selectedButtonIndex]?.cssColor ||
                              layout.buttons[selectedButtonIndex]?.cssColor ===
                                layout.defaultbuttons.cssColor
                                ? t("inheritDefault")
                                : undefined
                            }
                            value={
                              layout.buttons[selectedButtonIndex]?.cssColor ||
                              layout.defaultbuttons.cssColor ||
                              "#cccccc"
                            }
                            onChange={(event) =>
                              props.updateSelectedButtons((next) => {
                                next.buttons[selectedButtonIndex].cssColor =
                                  event.target.value;
                              })
                            }
                          />
                          <ColorInput
                            label={t("colorPressed")}
                            description={
                              !layout.buttons[selectedButtonIndex]
                                ?.cssPressedColor ||
                              layout.buttons[selectedButtonIndex]
                                ?.cssPressedColor ===
                                layout.defaultbuttons.cssPressedColor
                                ? t("inheritDefault")
                                : undefined
                            }
                            value={
                              layout.buttons[selectedButtonIndex]
                                ?.cssPressedColor ||
                              layout.defaultbuttons.cssPressedColor ||
                              "#999999"
                            }
                            onChange={(event) =>
                              props.updateSelectedButtons((next) => {
                                next.buttons[
                                  selectedButtonIndex
                                ].cssPressedColor = event.target.value;
                              })
                            }
                          />
                        </div>
                      )}
                    {selectedButtonIndex !== null &&
                      (layout.buttons[selectedButtonIndex]?.useCss ??
                        layout.defaultbuttons.useCss ??
                        false) && (
                        <div className="control row">
                          <InheritedSelect
                            size="xs"
                            label={t("buttonShape")}
                            value={
                              layout.buttons[selectedButtonIndex]?.cssShape
                            }
                            defaultValue={layout.defaultbuttons.cssShape}
                            fallbackValue="circle"
                            onChange={(event) =>
                              props.updateSelectedButtons((next) => {
                                if (event.target.value === "") {
                                  delete next.buttons[selectedButtonIndex]
                                    .cssShape;
                                } else {
                                  next.buttons[selectedButtonIndex].cssShape =
                                    event.target.value as ButtonShape;
                                }
                              })
                            }
                            data={[
                              { value: "", label: t("inheritDefault") },
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
                            value={
                              layout.buttons[selectedButtonIndex]?.cssTransition
                            }
                            defaultValue={layout.defaultbuttons.cssTransition}
                            fallbackValue="0.02"
                            onChange={(value) =>
                              props.updateSelectedButtons((next) => {
                                next.buttons[
                                  selectedButtonIndex
                                ].cssTransition = String(value ?? 0.02);
                              })
                            }
                            placeholder={
                              layout.defaultbuttons.cssTransition || "0.02"
                            }
                          />
                        </div>
                      )}
                    {selectedButtonIndex !== null &&
                      (layout.buttons[selectedButtonIndex]?.useCss ??
                        layout.defaultbuttons.useCss ??
                        false) && (
                        <InheritedSelect
                          size="xs"
                          label={t("easing")}
                          value={layout.buttons[selectedButtonIndex]?.cssEasing}
                          defaultValue={layout.defaultbuttons.cssEasing}
                          fallbackValue="ease"
                          onChange={(event) =>
                            props.updateSelectedButtons((next) => {
                              if (event.target.value === "") {
                                delete next.buttons[selectedButtonIndex]
                                  .cssEasing;
                              } else {
                                next.buttons[selectedButtonIndex].cssEasing =
                                  event.target.value;
                              }
                            })
                          }
                          data={[
                            { value: "", label: t("inheritDefault") },
                            { value: "ease", label: "ease" },
                            { value: "linear", label: "linear" },
                            { value: "ease-in", label: "ease-in" },
                            { value: "ease-out", label: "ease-out" },
                            { value: "ease-in-out", label: "ease-in-out" },
                          ]}
                        />
                      )}
                    {selectedButtonIndex !== null &&
                      !(
                        layout.buttons[selectedButtonIndex]?.useCss ??
                        layout.defaultbuttons.useCss ??
                        false
                      ) && (
                        <>
                          <Group gap="xs" align="end" wrap="nowrap">
                            <InheritedTextInput
                              size="xs"
                              label={t("releasedImage")}
                              value={layout.buttons[selectedButtonIndex]?.img}
                              defaultValue={layout.defaultbuttons.img}
                              onChange={(event) =>
                                props.updateSelectedButtons((next) => {
                                  next.buttons[selectedButtonIndex].img =
                                    event.target.value;
                                })
                              }
                              placeholder={
                                layout.defaultbuttons.img || "released.png"
                              }
                              className="grow"
                            />
                            <ImageSelectButton
                              onClick={() =>
                                props.openImagePicker({
                                  type: "button",
                                  indexes: props.selectedButtonIndexes,
                                  state: "released",
                                })
                              }
                            />
                          </Group>
                          <Group gap="xs" align="end" wrap="nowrap">
                            <InheritedTextInput
                              size="xs"
                              label={t("pressedImage")}
                              value={layout.buttons[selectedButtonIndex]?.imgp}
                              defaultValue={layout.defaultbuttons.imgp}
                              onChange={(event) =>
                                props.updateSelectedButtons((next) => {
                                  next.buttons[selectedButtonIndex].imgp =
                                    event.target.value;
                                })
                              }
                              placeholder={
                                layout.defaultbuttons.imgp || "pressed.png"
                              }
                              className="grow"
                            />
                            <ImageSelectButton
                              onClick={() =>
                                props.openImagePicker({
                                  type: "button",
                                  indexes: props.selectedButtonIndexes,
                                  state: "pressed",
                                })
                              }
                            />
                          </Group>
                        </>
                      )}
                    {selectedButtonIndex !== null && (
                      <>
                        <Text size="xs" fw={600}>
                          {t("releasedSize")}
                        </Text>
                        <InheritedSizeInputs
                          width={layout.buttons[selectedButtonIndex]?.w}
                          height={layout.buttons[selectedButtonIndex]?.h}
                          defaultWidth={layout.defaultbuttons.w}
                          defaultHeight={layout.defaultbuttons.h}
                          effectiveWidth={layout.defaultbuttons.w || "60"}
                          effectiveHeight={layout.defaultbuttons.h || "60"}
                          widthLabel={t("width")}
                          heightLabel={t("height")}
                          linked={props.aspectRatioLinked}
                          onLinkedChange={props.onAspectRatioLinkedChange}
                          onChange={(width, height) =>
                            props.updateSelectedButtons((next) => {
                              next.buttons[selectedButtonIndex].w = width;
                              next.buttons[selectedButtonIndex].h = height;
                            })
                          }
                        />
                        <InheritedNumberInput
                          size="xs"
                          label={t("rotation")}
                          min={-180}
                          max={180}
                          step={1}
                          value={layout.buttons[selectedButtonIndex]?.rotation}
                          defaultValue={layout.defaultbuttons.rotation}
                          fallbackValue="0"
                          onChange={(value) =>
                            props.updateSelectedButtons((next) => {
                              if (value === "" || value === null) {
                                delete next.buttons[selectedButtonIndex]
                                  .rotation;
                              } else {
                                next.buttons[selectedButtonIndex].rotation =
                                  String(value);
                              }
                            })
                          }
                          placeholder={layout.defaultbuttons.rotation || "0"}
                        />
                      </>
                    )}
                  </SelectedButtonSettings>
                ),
              },
            ]}
          />
          <Title order={2}>{t("buttonMapping")}</Title>
          <Text size="xs" c="dimmed">
            {t("clickPreviewToAssign")}
          </Text>
          {props.assigningTarget !== null &&
            !isStickAssignmentTarget(props.assigningTarget) && (
              <div className="mapping-status">
                <p>
                  {t("assigning")}: <span>{props.assignmentName}</span>
                </p>
                <Text size="xs" c="dimmed">
                  {t("pressButtonOrMoveAxis")}
                </Text>
                <Button
                  size="xs"
                  variant="light"
                  onClick={props.cancelAssignment}
                >
                  {t("cancel")}
                </Button>
              </div>
            )}
        </ButtonAdvancedSettings>
      </Stack>
    </Paper>
  );
}
