import { NumberInput } from "@mantine/core";
import { numericValue } from "../../editor-helpers";

interface PositionInputsProps {
  x: string;
  y: string;
  onXChange: (value: string) => void;
  onYChange: (value: string) => void;
}

export function PositionInputs({
  x,
  y,
  onXChange,
  onYChange,
}: PositionInputsProps): React.ReactElement {
  return (
    <div className="control row">
      <NumberInput
        size="xs"
        label="X (px)"
        value={numericValue(x)}
        onChange={(value) => onXChange(String(value ?? ""))}
      />
      <NumberInput
        size="xs"
        label="Y (px)"
        value={numericValue(y)}
        onChange={(value) => onYChange(String(value ?? ""))}
      />
    </div>
  );
}
