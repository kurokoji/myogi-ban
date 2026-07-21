import { Text } from "@mantine/core";

interface LayoutNameTextProps {
  name: string;
  maxWidth?: string;
}

export function LayoutNameText({
  name,
  maxWidth = "100%",
}: LayoutNameTextProps): React.ReactElement {
  return (
    <Text
      size="sm"
      fw={600}
      title={name}
      style={{ minWidth: 0, maxWidth, overflowWrap: "anywhere" }}
    >
      {name}
    </Text>
  );
}
