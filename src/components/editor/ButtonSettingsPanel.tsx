import {
  Button,
  Group,
  NativeSelect,
  NumberInput,
  Paper,
  Stack,
  Text,
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
import type { Layout } from "../../types";
import {
  ButtonAdvancedSettings,
  DefaultButtonSettings,
  SelectedButtonSettings,
} from "./ButtonSettingsSections";
import { DefaultButtonAppearanceSettings } from "./DefaultButtonAppearanceSettings";
import { DefaultButtonTextSettings } from "./DefaultButtonTextSettings";
import { InheritedNumberInput } from "./InheritedInputs";
import { InheritedSizeInputs } from "./InheritedSizeInputs";
import { InspectorTabs } from "./InspectorTabs";
import { LinkedSizeInputs } from "./LinkedSizeInputs";
import { PositionInputs } from "./PositionInputs";
import { SelectedButtonAppearanceSettings } from "./SelectedButtonAppearanceSettings";
import { SelectedButtonTextSettings } from "./SelectedButtonTextSettings";

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
                    <Title
                      order={5}
                      size="xs"
                      className="button-settings-group-title default-button-layout-title"
                    >
                      {t("buttonSizeAndRotation")}
                    </Title>
                    <Title
                      order={5}
                      size="xs"
                      className="button-settings-group-title default-button-appearance-title"
                    >
                      {t("buttonAppearance")}
                    </Title>
                    <Title
                      order={5}
                      size="xs"
                      className="button-settings-group-title default-button-text-title"
                    >
                      {t("buttonText")}
                    </Title>
                    <DefaultButtonAppearanceSettings
                      layout={layout}
                      updateLayout={updateLayout}
                      openImagePicker={props.openImagePicker}
                    />
                    <Stack gap="xs" className="default-button-layout-control">
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
                    </Stack>
                    <DefaultButtonTextSettings
                      layout={layout}
                      updateLayout={updateLayout}
                    />
                    <Button
                      size="xs"
                      variant="light"
                      color="gray"
                      className="default-button-reset-action"
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
                    action={
                      selectedButtonIndex === null ? null : (
                        <Button
                          size="compact-xs"
                          variant="light"
                          color="gray"
                          onClick={() => {
                            props.updateSelectedButtons((next) => {
                              next.buttons[selectedButtonIndex] =
                                resetButtonToDefaults(
                                  next.buttons[selectedButtonIndex],
                                  next.defaultbuttons,
                                );
                            });
                          }}
                        >
                          {t("resetToDefault")}
                        </Button>
                      )
                    }
                  >
                    {selectedButtonIndex !== null && (
                      <>
                        <Title
                          order={5}
                          size="xs"
                          className="button-settings-group-title selected-button-layout-title"
                        >
                          {t("buttonLayoutAndSize")}
                        </Title>
                        <Title
                          order={5}
                          size="xs"
                          className="button-settings-group-title selected-button-appearance-title"
                        >
                          {t("buttonAppearance")}
                        </Title>
                        <Title
                          order={5}
                          size="xs"
                          className="button-settings-group-title selected-button-text-title"
                        >
                          {t("buttonText")}
                        </Title>
                      </>
                    )}
                    {selectedButtonIndex !== null && (
                      <Stack gap="xs" className="selected-button-fields">
                        <SelectedButtonTextSettings
                          layout={layout}
                          index={selectedButtonIndex}
                          updateSelectedButtons={props.updateSelectedButtons}
                        />
                        {props.selectedButtonIndexes.length === 1 && (
                          <div className="selected-button-layout-control">
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
                          </div>
                        )}
                      </Stack>
                    )}
                    {selectedButtonIndex !== null && (
                      <SelectedButtonAppearanceSettings
                        layout={layout}
                        index={selectedButtonIndex}
                        selectedButtonIndexes={props.selectedButtonIndexes}
                        updateSelectedButtons={props.updateSelectedButtons}
                        openImagePicker={props.openImagePicker}
                      />
                    )}
                    {selectedButtonIndex !== null && (
                      <Stack
                        gap="xs"
                        className="selected-button-layout-control"
                      >
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
                      </Stack>
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
