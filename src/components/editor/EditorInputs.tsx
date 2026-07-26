import { type ChangeEventHandler, useId } from "react";

interface ColorInputProps {
  id?: string;
  label: string;
  description?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
}

/** A labelled native color input with the compact styling used by editor panels. */
export function ColorInput({
  id,
  label,
  description,
  value,
  onChange,
}: ColorInputProps): React.ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <div>
      <label
        htmlFor={inputId}
        style={{ fontSize: "11px", display: "block", marginBottom: "4px" }}
      >
        {label}
      </label>
      {description && (
        <span
          id={descriptionId}
          style={{
            color: "var(--mantine-color-dimmed)",
            fontSize: "10px",
            display: "block",
            marginBottom: "4px",
          }}
        >
          {description}
        </span>
      )}
      <input
        id={inputId}
        aria-describedby={descriptionId}
        type="color"
        value={value}
        onChange={onChange}
        style={{ width: "100%", height: "30px", cursor: "pointer" }}
      />
    </div>
  );
}
