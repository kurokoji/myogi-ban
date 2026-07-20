import { Button, NativeSelect, Paper, Stack, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface DisplaySettingsPanelProps {
  language: string;
  hasGuides: boolean;
  onLanguageChange: (language: string) => void;
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
