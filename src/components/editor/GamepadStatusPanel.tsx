import { Paper, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface GamepadStatusPanelProps {
  connected: boolean;
  gamepadName: string;
}

export function GamepadStatusPanel({
  connected,
  gamepadName,
}: GamepadStatusPanelProps): React.ReactElement {
  const { t } = useTranslation();

  return (
    <Paper className="panel" withBorder>
      <Title order={2}>{t("gamepad")}</Title>
      <Text
        size="xs"
        className={connected ? "status-connected" : "status-disconnected"}
      >
        {connected ? t("connected", { name: gamepadName }) : t("notConnected")}
      </Text>
    </Paper>
  );
}
