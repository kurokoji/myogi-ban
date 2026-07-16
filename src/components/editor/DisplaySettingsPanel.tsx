import { Button, NativeSelect, Paper, Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface DisplaySettingsPanelProps {
  language: string;
  previewScale: number;
  hasGuides: boolean;
  onLanguageChange: (language: string) => void;
  onPreviewScaleChange: (scale: number) => void;
  onClearGuides: () => void;
}

export function DisplaySettingsPanel(
  props: DisplaySettingsPanelProps,
): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Paper className="panel" withBorder>
      <Stack gap="xs">
        <Title order={2}>{t("display")}</Title>
        <NativeSelect
          size="xs"
          label={t("language")}
          value={props.language}
          onChange={(event) => props.onLanguageChange(event.target.value)}
          data={[
            { value: "ja", label: "日本語" },
            { value: "en", label: "English" },
          ]}
        />
        <label className="range-label">
          <span>
            {t("scale")} <b>{props.previewScale.toFixed(1)}</b>
          </span>
          <input
            type="range"
            min="0.1"
            max="3"
            step="0.1"
            value={props.previewScale}
            onChange={(event) =>
              props.onPreviewScaleChange(parseFloat(event.target.value))
            }
          />
        </label>
        <Button
          size="xs"
          variant="light"
          color="gray"
          onClick={props.onClearGuides}
          disabled={!props.hasGuides}
        >
          {t("clearGuides")}
        </Button>
      </Stack>
    </Paper>
  );
}
