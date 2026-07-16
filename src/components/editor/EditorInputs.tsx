import type { ChangeEventHandler } from "react";

interface ColorInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

/** A labelled native color input with the compact styling used by editor panels. */
export function ColorInput({
  id,
  label,
  value,
  onChange,
}: ColorInputProps): React.ReactElement {
  return (
    <div>
      <label
        htmlFor={id}
        style={{ fontSize: "11px", display: "block", marginBottom: "4px" }}
      >
        {label}
      </label>
      <input
        id={id}
        type="color"
        value={value}
        onChange={onChange}
        style={{ width: "100%", height: "30px", cursor: "pointer" }}
      />
    </div>
  );
}
