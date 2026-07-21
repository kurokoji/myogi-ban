import { Button } from "@mantine/core";
import { useTranslation } from "react-i18next";

interface ImageSelectButtonProps {
  onClick: () => void;
}

export function ImageSelectButton({
  onClick,
}: ImageSelectButtonProps): React.ReactElement {
  const { t } = useTranslation();
  return (
    <Button
      size="xs"
      variant="light"
      style={{ flexShrink: 0 }}
      onClick={onClick}
    >
      {t("selectFile")}
    </Button>
  );
}
