import {
  Button,
  Group,
  NumberInput,
  Paper,
  Stack,
  Switch,
  TextInput,
  Title,
} from "@mantine/core";
import type { ChangeEvent, RefObject } from "react";
import { useTranslation } from "react-i18next";
import {
  type EditorLayoutUpdater,
  type ImageUploadTarget,
  numericValue,
} from "../../editor-helpers";
import type { Layout } from "../../types";
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
          checked={!(layout.stick.useCss ?? false)}
          onChange={(event) =>
            updateLayout((next) => {
              next.stick.useCss = !event.target.checked;
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
  fileInputRef: RefObject<HTMLInputElement | null>;
  updateLayout: EditorLayoutUpdater;
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
            {t("bgOpacity")} <b>{layout.background.opacity.toFixed(1)}</b>
          </span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={layout.background.opacity}
            onChange={(event) =>
              updateLayout((next) => {
                next.background.opacity = parseFloat(event.target.value);
              })
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
          checked={!(layout.background.useCss ?? true)}
          onChange={(event) =>
            updateLayout((next) => {
              next.background.useCss = !event.target.checked;
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

export { ButtonSettingsPanel } from "./ButtonSettingsPanel";
