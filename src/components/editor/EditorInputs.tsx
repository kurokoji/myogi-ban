import {
  type ChangeEvent,
  type ChangeEventHandler,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

interface ColorInputProps {
  id?: string;
  label: string;
  description?: string;
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: string;
}

const COMMIT_DEBOUNCE_MS = 200;

/**
 * A labelled native color input with the compact styling used by editor
 * panels. The native picker fires the "input" event continuously while the
 * user drags inside it, so committing on every tick (layout clone + undo
 * history + full re-render) makes the picker itself feel laggy. Instead we
 * track the live value locally and only commit a short while after the
 * user stops moving, rather than depending on the native "change" event
 * (which some browsers only fire once the whole picker closes, not on
 * every release within it).
 */
export function ColorInput({
  id,
  label,
  description,
  value,
  onChange,
  className,
}: ColorInputProps): React.ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const [draftValue, setDraftValue] = useState(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const pendingValueRef = useRef<string | null>(null);
  const commitTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  const commit = useCallback((nextValue: string) => {
    pendingValueRef.current = null;
    onChangeRef.current({
      target: { value: nextValue },
    } as ChangeEvent<HTMLInputElement>);
  }, []);

  useEffect(
    () => () => {
      if (commitTimeoutRef.current === null) return;
      clearTimeout(commitTimeoutRef.current);
      if (pendingValueRef.current !== null) commit(pendingValueRef.current);
    },
    [commit],
  );

  return (
    <div className={className}>
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
        value={draftValue}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftValue(nextValue);
          pendingValueRef.current = nextValue;
          if (commitTimeoutRef.current !== null) {
            clearTimeout(commitTimeoutRef.current);
          }
          commitTimeoutRef.current = setTimeout(() => {
            commitTimeoutRef.current = null;
            commit(nextValue);
          }, COMMIT_DEBOUNCE_MS);
        }}
        style={{ width: "100%", height: "30px", cursor: "pointer" }}
      />
    </div>
  );
}
