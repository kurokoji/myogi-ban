import { Switch, type SwitchProps } from "@mantine/core";
import {
  type ChangeEvent,
  type ChangeEventHandler,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

interface LabeledFieldProps {
  inputId: string;
  label: string;
  description?: string;
  descriptionId?: string;
  /**
   * "below" (default) stacks the description on its own line under the
   * label, matching Mantine's own inputs. "inline" places it beside the
   * label instead, so a row with a description (e.g. "inheritDefault") is
   * no taller than a plain one - useful where that extra line would
   * otherwise throw off the vertical alignment of same-row siblings, such
   * as a LabeledSwitch next to a ColorInput.
   */
  descriptionPlacement?: "below" | "inline";
  className?: string;
  children: React.ReactNode;
}

const LABEL_STYLE: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "var(--mantine-font-weight-regular)",
};

const DESCRIPTION_STYLE: React.CSSProperties = {
  color: "var(--mantine-color-dimmed)",
  fontSize: "10px",
};

/**
 * The label-above-control layout shared by the compact editor inputs
 * (ColorInput, LabeledSwitch, and anything else that needs the same
 * treatment - pass whatever control belongs under the label as children).
 * Keeping the label styling in one place is what keeps a label's font size
 * and weight consistent with Mantine's own input labels (which is what a
 * label built ad hoc per control tends to drift from), and what makes a
 * label's height consistent across differently-shaped controls placed side
 * by side in a row, so their control areas line up.
 */
export function LabeledField({
  inputId,
  label,
  description,
  descriptionId,
  descriptionPlacement = "below",
  className,
  children,
}: LabeledFieldProps): React.ReactElement {
  const labelElement = (
    <label
      htmlFor={inputId}
      style={{
        ...LABEL_STYLE,
        display: descriptionPlacement === "inline" ? undefined : "block",
        marginBottom: descriptionPlacement === "inline" ? undefined : "4px",
      }}
    >
      {label}
    </label>
  );
  const descriptionElement = description && (
    <span
      id={descriptionId}
      style={{
        ...DESCRIPTION_STYLE,
        display: descriptionPlacement === "inline" ? undefined : "block",
        marginBottom: descriptionPlacement === "inline" ? undefined : "4px",
      }}
    >
      {description}
    </span>
  );

  return (
    <div className={className}>
      {descriptionPlacement === "inline" ? (
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "6px",
            marginBottom: "4px",
          }}
        >
          {labelElement}
          {descriptionElement}
        </div>
      ) : (
        <>
          {labelElement}
          {descriptionElement}
        </>
      )}
      {children}
    </div>
  );
}

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
    <LabeledField
      inputId={inputId}
      label={label}
      description={description}
      descriptionId={descriptionId}
      className={className}
    >
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
    </LabeledField>
  );
}

interface LabeledSwitchProps {
  id?: string;
  label: string;
  description?: string;
  descriptionPlacement?: "below" | "inline";
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  className?: string;
  size?: SwitchProps["size"];
}

/**
 * A Switch laid out label-above-control, matching ColorInput and the other
 * compact editor inputs instead of Mantine's default label-beside-track
 * layout. That keeps a switch's track at the same vertical offset as its
 * row siblings (e.g. a ColorInput that only appears once the switch is on),
 * so the row doesn't look misaligned when that sibling appears. The label
 * is a plain <label htmlFor>, so the switch's accessible name is the label
 * alone; the description is wired through aria-describedby rather than
 * folded into the name, matching how ColorInput and the Inherited*Input
 * controls expose their description.
 */
export function LabeledSwitch({
  id,
  label,
  description,
  descriptionPlacement,
  checked,
  onChange,
  className,
  size = "sm",
}: LabeledSwitchProps): React.ReactElement {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <LabeledField
      inputId={inputId}
      label={label}
      description={description}
      descriptionPlacement={descriptionPlacement}
      descriptionId={descriptionId}
      className={className}
    >
      <Switch
        id={inputId}
        aria-describedby={descriptionId}
        size={size}
        checked={checked}
        onChange={onChange}
      />
    </LabeledField>
  );
}
