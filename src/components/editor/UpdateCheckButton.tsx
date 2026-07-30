import { Button } from "@mantine/core";
import { IconRefresh } from "@tabler/icons-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface UpdateCheckButtonProps {
  checking: boolean;
  updateAvailable: boolean;
  onCheckNow: () => Promise<void>;
}

export function UpdateCheckButton({
  checking,
  updateAvailable,
  onCheckNow,
}: UpdateCheckButtonProps): React.ReactElement {
  const { t } = useTranslation();
  const [justChecked, setJustChecked] = useState(false);

  const handleClick = async () => {
    await onCheckNow();
    setJustChecked(true);
    window.setTimeout(() => setJustChecked(false), 2000);
  };

  return (
    <>
      <Button
        size="xs"
        variant="light"
        leftSection={<IconRefresh size={14} />}
        onClick={handleClick}
        loading={checking}
      >
        {t("checkForUpdates")}
      </Button>
      {justChecked && !updateAvailable && (
        <span className="copy-feedback">{t("upToDate")}</span>
      )}
    </>
  );
}
