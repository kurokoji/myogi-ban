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
import type { ChangeEvent, RefObject } from "react";
import { useTranslation } from "react-i18next";
import {
  type AssigningTarget,
  createEmptyButtonLayout,
  type EditorLayoutUpdater,
  type ImageUploadTarget,
  numericValue,
} from "../../editor-helpers";
import type { ButtonShape, Layout } from "../../types";
import { ColorInput } from "./EditorInputs";

export { DisplaySettingsPanel } from "./DisplaySettingsPanel";
export { GamepadStatusPanel } from "./GamepadStatusPanel";
export { LayoutSettingsPanel } from "./LayoutSettingsPanel";

interface StickSettingsPanelProps {
  layout: Layout;
  updateLayout: EditorLayoutUpdater;
}

export function StickSettingsPanel({
  layout,
  updateLayout,
}: StickSettingsPanelProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t("stick")}</Title>
        <Switch
          size="sm"
          label={t("showStick")}
          checked={layout.showstick}
          onChange={(event) =>
            updateLayout((next) => {
              next.showstick = event.target.checked;
            })
          }
        />
        <div className="control row">
          <NumberInput
            size="xs"
            label="X"
            value={numericValue(layout.stick.x)}
            onChange={(value) =>
              updateLayout((next) => {
                next.stick.x = String(value ?? "");
              })
            }
          />
          <NumberInput
            size="xs"
            label="Y"
            value={numericValue(layout.stick.y)}
            onChange={(value) =>
              updateLayout((next) => {
                next.stick.y = String(value ?? "");
              })
            }
          />
        </div>
        <div className="control row">
          <NumberInput
            size="xs"
            label="W%"
            value={numericValue(layout.stick.w)}
            onChange={(value) =>
              updateLayout((next) => {
                next.stick.w = String(value ?? "");
              })
            }
          />
          <NumberInput
            size="xs"
            label="H%"
            value={numericValue(layout.stick.h)}
            onChange={(value) =>
              updateLayout((next) => {
                next.stick.h = String(value ?? "");
              })
            }
          />
        </div>
        <Switch
          size="sm"
          label={t("useCssStick")}
          checked={layout.stick.useCss ?? false}
          onChange={(event) =>
            updateLayout((next) => {
              next.stick.useCss = event.target.checked;
            })
          }
        />
        {layout.stick.useCss && (
          <div className="control row">
            <ColorInput
              id="stick-plate-color"
              label={t("stickPlateColor")}
              value={layout.stick.cssPlateColor || "#888888"}
              onChange={(event) =>
                updateLayout((next) => {
                  next.stick.cssPlateColor = event.target.value;
                })
              }
            />
            <ColorInput
              id="stick-knob-shaft-color"
              label={t("stickKnobShaft")}
              value={layout.stick.cssColor || "#cccccc"}
              onChange={(event) =>
                updateLayout((next) => {
                  next.stick.cssColor = event.target.value;
                })
              }
            />
          </div>
        )}
      </Stack>
    </Paper>
  );
}

interface BackgroundSettingsPanelProps {
  layout: Layout;
  backgroundOpacity: number;
  fileInputRef: RefObject<HTMLInputElement | null>;
  updateLayout: EditorLayoutUpdater;
  onBackgroundOpacityChange: (opacity: number) => void;
  uploadImage: (event: ChangeEvent<HTMLInputElement>) => void;
  openImagePicker: (target: ImageUploadTarget) => void;
}

export function BackgroundSettingsPanel(
  props: BackgroundSettingsPanelProps,
): React.ReactElement {
  const { t } = useTranslation();
  const { layout, updateLayout } = props;

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t("background")}</Title>
        <label className="range-label">
          <span>
            {t("bgOpacity")} <b>{props.backgroundOpacity.toFixed(1)}</b>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={props.backgroundOpacity}
            onChange={(event) =>
              props.onBackgroundOpacityChange(parseFloat(event.target.value))
            }
          />
        </label>
        <Switch
          size="sm"
          label={t("showBackground")}
          checked={layout.background.show}
          onChange={(event) =>
            updateLayout((next) => {
              next.background.show = event.target.checked;
            })
          }
        />
        <Switch
          size="sm"
          label={t("useCssBg")}
          checked={layout.background.useCss ?? true}
          onChange={(event) =>
            updateLayout((next) => {
              next.background.useCss = event.target.checked;
            })
          }
        />
        {layout.background.useCss ? (
          <>
            <ColorInput
              id="background-color"
              label={t("bgColor")}
              value={layout.background.cssColor || "#0b0f14"}
              onChange={(event) =>
                updateLayout((next) => {
                  next.background.cssColor = event.target.value;
                })
              }
            />
            <NumberInput
              size="xs"
              label={t("borderRadius")}
              min={0}
              max={999}
              value={layout.background.cssBorderRadius ?? 0}
              onChange={(value) =>
                updateLayout((next) => {
                  next.background.cssBorderRadius = Number(value) || 0;
                })
              }
            />
            <div className="control row">
              <NumberInput
                size="xs"
                label={t("obsWidth")}
                min={1}
                value={numericValue(layout.background.w)}
                onChange={(value) =>
                  updateLayout((next) => {
                    next.background.w = String(value ?? "");
                  })
                }
              />
              <NumberInput
                size="xs"
                label={t("obsHeight")}
                min={1}
                value={numericValue(layout.background.h)}
                onChange={(value) =>
                  updateLayout((next) => {
                    next.background.h = String(value ?? "");
                  })
                }
              />
            </div>
          </>
        ) : (
          <>
            <Group gap="xs" align="end" wrap="nowrap">
              <TextInput
                size="xs"
                label={t("bgImage")}
                value={layout.background.image}
                onChange={(event) =>
                  updateLayout((next) => {
                    next.background.image = event.target.value;
                  })
                }
                placeholder="background.png"
                className="grow"
              />
              <Button
                size="xs"
                variant="light"
                onClick={() => props.openImagePicker({ type: "background" })}
              >
                {t("selectFile")}
              </Button>
            </Group>
            <NumberInput
              size="xs"
              label={t("bgScale")}
              min={0.1}
              max={5}
              step={0.1}
              value={numericValue(layout.background.scale || "1")}
              onChange={(value) =>
                updateLayout((next) => {
                  next.background.scale = String(value ?? "");
                })
              }
            />
            {layout.background.image && (
              <div className="control row obs-size-row">
                <label>{t("obsWidth")}</label>
                <span className="readonly-value">
                  {layout.background.w || "500"}
                </span>
                <label>{t("obsHeight")}</label>
                <span className="readonly-value">
                  {layout.background.h || "250"}
                </span>
              </div>
            )}
          </>
        )}
        <input
          ref={props.fileInputRef}
          type="file"
          accept="image/*"
          onChange={props.uploadImage}
          hidden
        />
      </Stack>
    </Paper>
  );
}

interface ButtonSettingsPanelProps {
  layout: Layout;
  assigningTarget: AssigningTarget;
  assignmentName: string;
  selectedButtonIndex: number | null;
  updateLayout: EditorLayoutUpdater;
  onSelectedButtonChange: (index: number | null) => void;
  openImagePicker: (target: ImageUploadTarget) => void;
  cancelAssignment: () => void;
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
        <NumberInput
          size="xs"
          label={t("count")}
          min={0}
          max={48}
          value={layout.totalbuttonshow}
          onChange={(value) =>
            updateLayout((next) => {
              next.totalbuttonshow = Math.max(
                0,
                Math.min(48, Number(value) || 0),
              );
              while (next.buttons.length < next.totalbuttonshow)
                next.buttons.push(createEmptyButtonLayout());
            })
          }
        />
        <Switch
          size="sm"
          label={t("useCssButton")}
          checked={layout.defaultbuttons.useCss ?? false}
          onChange={(event) =>
            updateLayout((next) => {
              next.defaultbuttons.useCss = event.target.checked;
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
              value={layout.defaultbuttons.cssPressedColor || "#999999"}
              onChange={(event) =>
                updateLayout((next) => {
                  next.defaultbuttons.cssPressedColor = event.target.value;
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
                    if ((button.cssShape ?? previousShape) === previousShape) {
                      delete button.cssShape;
                    }
                  }
                })
              }
              data={[
                { value: "circle", label: t("shapeCircle") },
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
              value={parseFloat(layout.defaultbuttons.cssTransition || "0.02")}
              onChange={(value) =>
                updateLayout((next) => {
                  next.defaultbuttons.cssTransition = String(value ?? 0.02);
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
              <Button
                size="xs"
                variant="light"
                onClick={() =>
                  props.openImagePicker({
                    type: "defaultButton",
                    state: "released",
                  })
                }
              >
                {t("selectFile")}
              </Button>
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
              <Button
                size="xs"
                variant="light"
                onClick={() =>
                  props.openImagePicker({
                    type: "defaultButton",
                    state: "pressed",
                  })
                }
              >
                {t("selectFile")}
              </Button>
            </Group>
          </>
        )}
        <Text size="xs" fw={600}>
          {t("defaultButtonSize")}
        </Text>
        <div className="control row">
          <NumberInput
            size="xs"
            label={t("width")}
            value={numericValue(layout.defaultbuttons.w)}
            onChange={(value) =>
              updateLayout((next) => {
                next.defaultbuttons.w = String(value ?? "");
              })
            }
          />
          <NumberInput
            size="xs"
            label={t("height")}
            value={numericValue(layout.defaultbuttons.h)}
            onChange={(value) =>
              updateLayout((next) => {
                next.defaultbuttons.h = String(value ?? "");
              })
            }
          />
        </div>
        <div className="control row">
          <NumberInput
            size="xs"
            label={t("pressedWidth")}
            value={numericValue(layout.defaultbuttons.wp)}
            onChange={(value) =>
              updateLayout((next) => {
                next.defaultbuttons.wp = String(value ?? "");
              })
            }
          />
          <NumberInput
            size="xs"
            label={t("pressedHeight")}
            value={numericValue(layout.defaultbuttons.hp)}
            onChange={(value) =>
              updateLayout((next) => {
                next.defaultbuttons.hp = String(value ?? "");
              })
            }
          />
        </div>
        <NumberInput
          size="xs"
          label={t("rotation")}
          min={-180}
          max={180}
          step={1}
          value={numericValue(layout.defaultbuttons.rotation || "0")}
          onChange={(value) =>
            updateLayout((next) => {
              const previousRotation = next.defaultbuttons.rotation ?? "0";
              next.defaultbuttons.rotation = String(value ?? 0);
              for (const button of next.buttons) {
                if (
                  (button.rotation ?? previousRotation) === previousRotation
                ) {
                  delete button.rotation;
                }
              }
            })
          }
        />
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
            ...Array.from(
              { length: Math.max(1, layout.totalbuttonshow) },
              (_, index) => ({
                value: String(index),
                label: `${t("buttonLabel")} ${index + 1}`,
              }),
            ),
          ]}
        />
        {selectedButtonIndex !== null && (
          <Group gap="xs">
            <Switch
              size="sm"
              label={t("useCssButton")}
              checked={
                layout.buttons[selectedButtonIndex]?.useCss ??
                layout.defaultbuttons.useCss ??
                false
              }
              onChange={(event) =>
                updateLayout((next) => {
                  next.buttons[selectedButtonIndex].useCss =
                    event.target.checked;
                })
              }
            />
            <Button
              size="xs"
              variant="light"
              color="gray"
              onClick={() => {
                updateLayout((next) => {
                  next.buttons[selectedButtonIndex] = {
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
                  };
                });
              }}
            >
              {t("resetToDefault")}
            </Button>
          </Group>
        )}
        <Button
          size="xs"
          variant="light"
          color="gray"
          onClick={() =>
            updateLayout((next) => {
              next.buttons = next.buttons.map((b) => ({
                x: b.x,
                y: b.y,
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
              }));
            })
          }
        >
          {t("resetAllToDefault")}
        </Button>
        {selectedButtonIndex !== null &&
          (layout.buttons[selectedButtonIndex]?.useCss ??
            layout.defaultbuttons.useCss ??
            false) && (
            <div className="control row">
              <ColorInput
                label={t("colorNormal")}
                value={
                  layout.buttons[selectedButtonIndex]?.cssColor ===
                  layout.defaultbuttons.cssColor
                    ? "#cccccc"
                    : (layout.buttons[selectedButtonIndex]?.cssColor ??
                      layout.defaultbuttons.cssColor ??
                      "#cccccc")
                }
                onChange={(event) =>
                  updateLayout((next) => {
                    next.buttons[selectedButtonIndex].cssColor =
                      event.target.value;
                  })
                }
              />
              <ColorInput
                label={t("colorPressed")}
                value={
                  layout.buttons[selectedButtonIndex]?.cssPressedColor ===
                  layout.defaultbuttons.cssPressedColor
                    ? "#999999"
                    : (layout.buttons[selectedButtonIndex]?.cssPressedColor ??
                      layout.defaultbuttons.cssPressedColor ??
                      "#999999")
                }
                onChange={(event) =>
                  updateLayout((next) => {
                    next.buttons[selectedButtonIndex].cssPressedColor =
                      event.target.value;
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
              <NativeSelect
                size="xs"
                label={t("buttonShape")}
                value={
                  layout.buttons[selectedButtonIndex]?.cssShape ===
                  layout.defaultbuttons.cssShape
                    ? ""
                    : (layout.buttons[selectedButtonIndex]?.cssShape ?? "")
                }
                onChange={(event) =>
                  updateLayout((next) => {
                    if (event.target.value === "") {
                      delete next.buttons[selectedButtonIndex].cssShape;
                    } else {
                      next.buttons[selectedButtonIndex].cssShape = event.target
                        .value as ButtonShape;
                    }
                  })
                }
                data={[
                  { value: "", label: t("inheritDefault") },
                  { value: "circle", label: t("shapeCircle") },
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
                value={
                  layout.buttons[selectedButtonIndex]?.cssTransition ===
                  layout.defaultbuttons.cssTransition
                    ? ""
                    : parseFloat(
                        layout.buttons[selectedButtonIndex]?.cssTransition ??
                          layout.defaultbuttons.cssTransition ??
                          "0.02",
                      )
                }
                onChange={(value) =>
                  updateLayout((next) => {
                    next.buttons[selectedButtonIndex].cssTransition = String(
                      value ?? 0.02,
                    );
                  })
                }
                placeholder={layout.defaultbuttons.cssTransition || "0.02"}
              />
            </div>
          )}
        {selectedButtonIndex !== null &&
          (layout.buttons[selectedButtonIndex]?.useCss ??
            layout.defaultbuttons.useCss ??
            false) && (
            <NativeSelect
              size="xs"
              label={t("easing")}
              value={
                layout.buttons[selectedButtonIndex]?.cssEasing ===
                layout.defaultbuttons.cssEasing
                  ? ""
                  : (layout.buttons[selectedButtonIndex]?.cssEasing ??
                    layout.defaultbuttons.cssEasing ??
                    "ease")
              }
              onChange={(event) =>
                updateLayout((next) => {
                  if (event.target.value === "") {
                    delete next.buttons[selectedButtonIndex].cssEasing;
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
                <TextInput
                  size="xs"
                  label={t("releasedImage")}
                  value={
                    layout.buttons[selectedButtonIndex]?.img ===
                    layout.defaultbuttons.img
                      ? ""
                      : layout.buttons[selectedButtonIndex]?.img || ""
                  }
                  onChange={(event) =>
                    updateLayout((next) => {
                      next.buttons[selectedButtonIndex].img =
                        event.target.value;
                    })
                  }
                  placeholder={layout.defaultbuttons.img || "released.png"}
                  className="grow"
                />
                <Button
                  size="xs"
                  variant="light"
                  onClick={() =>
                    props.openImagePicker({
                      type: "button",
                      index: selectedButtonIndex,
                      state: "released",
                    })
                  }
                >
                  {t("selectFile")}
                </Button>
              </Group>
              <Group gap="xs" align="end" wrap="nowrap">
                <TextInput
                  size="xs"
                  label={t("pressedImage")}
                  value={
                    layout.buttons[selectedButtonIndex]?.imgp ===
                    layout.defaultbuttons.imgp
                      ? ""
                      : layout.buttons[selectedButtonIndex]?.imgp || ""
                  }
                  onChange={(event) =>
                    updateLayout((next) => {
                      next.buttons[selectedButtonIndex].imgp =
                        event.target.value;
                    })
                  }
                  placeholder={layout.defaultbuttons.imgp || "pressed.png"}
                  className="grow"
                />
                <Button
                  size="xs"
                  variant="light"
                  onClick={() =>
                    props.openImagePicker({
                      type: "button",
                      index: selectedButtonIndex,
                      state: "pressed",
                    })
                  }
                >
                  {t("selectFile")}
                </Button>
              </Group>
            </>
          )}
        {selectedButtonIndex !== null && (
          <>
            <Text size="xs" fw={600}>
              {t("releasedSize")}
            </Text>
            <div className="control row">
              <NumberInput
                size="xs"
                label={t("width")}
                value={
                  layout.buttons[selectedButtonIndex]?.w ===
                  layout.defaultbuttons.w
                    ? ""
                    : numericValue(layout.buttons[selectedButtonIndex]?.w || "")
                }
                onChange={(value) =>
                  updateLayout((next) => {
                    next.buttons[selectedButtonIndex].w = String(value ?? "");
                  })
                }
                placeholder={layout.defaultbuttons.w || "60"}
              />
              <NumberInput
                size="xs"
                label={t("height")}
                value={
                  layout.buttons[selectedButtonIndex]?.h ===
                  layout.defaultbuttons.h
                    ? ""
                    : numericValue(layout.buttons[selectedButtonIndex]?.h || "")
                }
                onChange={(value) =>
                  updateLayout((next) => {
                    next.buttons[selectedButtonIndex].h = String(value ?? "");
                  })
                }
                placeholder={layout.defaultbuttons.h || "60"}
              />
            </div>
            <Text size="xs" fw={600}>
              {t("pressedSize")}
            </Text>
            <div className="control row">
              <NumberInput
                size="xs"
                label={t("pressedWidth")}
                value={
                  layout.buttons[selectedButtonIndex]?.wp ===
                  layout.defaultbuttons.wp
                    ? ""
                    : numericValue(
                        layout.buttons[selectedButtonIndex]?.wp || "",
                      )
                }
                onChange={(value) =>
                  updateLayout((next) => {
                    next.buttons[selectedButtonIndex].wp = String(value ?? "");
                  })
                }
                placeholder={layout.defaultbuttons.wp || "60"}
              />
              <NumberInput
                size="xs"
                label={t("pressedHeight")}
                value={
                  layout.buttons[selectedButtonIndex]?.hp ===
                  layout.defaultbuttons.hp
                    ? ""
                    : numericValue(
                        layout.buttons[selectedButtonIndex]?.hp || "",
                      )
                }
                onChange={(value) =>
                  updateLayout((next) => {
                    next.buttons[selectedButtonIndex].hp = String(value ?? "");
                  })
                }
                placeholder={layout.defaultbuttons.hp || "60"}
              />
            </div>
            <NumberInput
              size="xs"
              label={t("rotation")}
              min={-180}
              max={180}
              step={1}
              value={
                layout.buttons[selectedButtonIndex]?.rotation ===
                layout.defaultbuttons.rotation
                  ? ""
                  : numericValue(
                      layout.buttons[selectedButtonIndex]?.rotation ?? "",
                    )
              }
              onChange={(value) =>
                updateLayout((next) => {
                  if (value === "" || value === null) {
                    delete next.buttons[selectedButtonIndex].rotation;
                  } else {
                    next.buttons[selectedButtonIndex].rotation = String(value);
                  }
                })
              }
              placeholder={layout.defaultbuttons.rotation || "0"}
            />
          </>
        )}
        <Text size="xs" c="dimmed">
          {t("useDefaultWhenBlank")}
        </Text>
        <Title order={2}>{t("buttonMapping")}</Title>
        <Text size="xs" c="dimmed">
          {t("clickPreviewToAssign")}
        </Text>
        {props.assigningTarget !== null && (
          <div className="mapping-status">
            <p>
              {t("assigning")}: <span>{props.assignmentName}</span>
            </p>
            <Text size="xs" c="dimmed">
              {t("pressButtonOrHoldAxis")}
            </Text>
            <Button size="xs" variant="light" onClick={props.cancelAssignment}>
              {t("cancel")}
            </Button>
          </div>
        )}
      </Stack>
    </Paper>
  );
}
