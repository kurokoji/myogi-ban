import {
  NativeSelect,
  type NativeSelectProps,
  NumberInput,
  type NumberInputProps,
  TextInput,
  type TextInputProps,
} from "@mantine/core";
import { useTranslation } from "react-i18next";
import { numericValue } from "../../editor-helpers";

interface InheritedNumberInputProps
  extends Omit<NumberInputProps, "value" | "defaultValue" | "onChange"> {
  value: string | undefined;
  defaultValue: string | undefined;
  fallbackValue: string;
  onChange: (value: string | number) => void;
}

export function InheritedNumberInput({
  value,
  defaultValue,
  fallbackValue,
  onChange,
  ...inputProps
}: InheritedNumberInputProps): React.ReactElement {
  const { t } = useTranslation();
  const inherited = !value || value === defaultValue;
  const effectiveValue = inherited ? defaultValue || fallbackValue : value;

  return (
    <NumberInput
      {...inputProps}
      description={inherited ? t("inheritDefault") : inputProps.description}
      value={numericValue(effectiveValue)}
      onChange={onChange}
    />
  );
}

interface InheritedSelectProps
  extends Omit<NativeSelectProps, "value" | "defaultValue"> {
  value: string | undefined;
  defaultValue: string | undefined;
  fallbackValue: string;
}

export function InheritedSelect({
  value,
  defaultValue,
  fallbackValue,
  ...selectProps
}: InheritedSelectProps): React.ReactElement {
  const { t } = useTranslation();
  const inherited = !value || value === defaultValue;

  return (
    <NativeSelect
      {...selectProps}
      description={inherited ? t("inheritDefault") : selectProps.description}
      value={inherited ? defaultValue || fallbackValue : value}
    />
  );
}

interface InheritedTextInputProps
  extends Omit<TextInputProps, "value" | "defaultValue"> {
  value: string | undefined;
  defaultValue: string | undefined;
}

export function InheritedTextInput({
  value,
  defaultValue,
  ...inputProps
}: InheritedTextInputProps): React.ReactElement {
  const { t } = useTranslation();
  const inherited = !value || value === defaultValue;

  return (
    <TextInput
      {...inputProps}
      description={inherited ? t("inheritDefault") : inputProps.description}
      value={inherited ? defaultValue || "" : value}
    />
  );
}
