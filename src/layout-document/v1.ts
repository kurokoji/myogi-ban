import { ensureLayoutDefaults } from "../layout";
import type { Layout } from "../types";

export type LayoutDocumentV1 = Partial<Layout>;

const BUTTON_NUMERIC_TEXT_FIELDS = [
  "x",
  "y",
  "w",
  "h",
  "xp",
  "yp",
  "wp",
  "hp",
  "rotation",
  "cssTransition",
] as const;
const STICK_NUMERIC_TEXT_FIELDS = [
  "x",
  "y",
  "w",
  "h",
  "cssTransition",
] as const;
const BACKGROUND_NUMERIC_TEXT_FIELDS = ["scale", "w", "h"] as const;

function normalizeNumericTextFields(
  value: unknown,
  fields: readonly string[],
): unknown {
  if (typeof value !== "object" || value === null) return value;

  const normalized = { ...value } as Record<string, unknown>;
  for (const field of fields) {
    if (typeof normalized[field] === "number") {
      normalized[field] = String(normalized[field]);
    }
  }
  return normalized;
}

export function deserializeLayoutDocumentV1(
  document: LayoutDocumentV1,
): Layout {
  const legacy = document as Record<string, unknown>;
  const buttons = Array.isArray(legacy.buttons)
    ? legacy.buttons.map((button) =>
        normalizeNumericTextFields(button, BUTTON_NUMERIC_TEXT_FIELDS),
      )
    : legacy.buttons;

  return ensureLayoutDefaults({
    ...document,
    sourceFormatVersion: 1,
    stick: normalizeNumericTextFields(legacy.stick, STICK_NUMERIC_TEXT_FIELDS),
    defaultbuttons: normalizeNumericTextFields(
      legacy.defaultbuttons,
      BUTTON_NUMERIC_TEXT_FIELDS,
    ),
    buttons,
    background: normalizeNumericTextFields(
      legacy.background,
      BACKGROUND_NUMERIC_TEXT_FIELDS,
    ),
  } as Partial<Layout>);
}
