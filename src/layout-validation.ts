import { MAX_VISIBLE_BUTTONS } from "./app-constants";
import { deserializeLayoutDocument } from "./layout-document";
import type { Layout } from "./types";

export class InvalidLayoutError extends Error {
  constructor() {
    super("Invalid layout");
    this.name = "InvalidLayoutError";
  }
}

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = ["version", "name"];
const buttonStrings = [
  "x",
  "y",
  "w",
  "h",
  "img",
  "xp",
  "yp",
  "wp",
  "hp",
  "imgp",
  "rotation",
  "cssColor",
  "cssPressedColor",
  "cssTransition",
  "cssEasing",
  "text",
  "cssTextColor",
  "cssTextSize",
  "cssTextOutlineColor",
];
const buttonBooleans = [
  "useCss",
  "cssTextBold",
  "cssTextItalic",
  "cssTextOutline",
];

function validateButton(value: unknown): void {
  if (!object(value)) throw new InvalidLayoutError();
  for (const key of buttonStrings)
    if (key in value && typeof value[key] !== "string")
      throw new InvalidLayoutError();
  for (const key of buttonBooleans)
    if (key in value && typeof value[key] !== "boolean")
      throw new InvalidLayoutError();
  if (
    "cssShape" in value &&
    !["circle", "pill", "rounded", "square"].includes(String(value.cssShape))
  )
    throw new InvalidLayoutError();
}

export function validateImportedLayout(
  value: unknown,
): asserts value is Partial<Layout> {
  if (!object(value)) throw new InvalidLayoutError();
  for (const key of strings)
    if (key in value && typeof value[key] !== "string")
      throw new InvalidLayoutError();
  if (
    "totalbuttonshow" in value &&
    (!Number.isInteger(value.totalbuttonshow) ||
      Number(value.totalbuttonshow) < 0 ||
      Number(value.totalbuttonshow) > MAX_VISIBLE_BUTTONS)
  )
    throw new InvalidLayoutError();
  if ("showstick" in value && typeof value.showstick !== "boolean")
    throw new InvalidLayoutError();
  if ("buttons" in value) {
    if (!Array.isArray(value.buttons)) throw new InvalidLayoutError();
    value.buttons.forEach(validateButton);
  }
  if ("defaultbuttons" in value) validateButton(value.defaultbuttons);
  if ("stick" in value && !object(value.stick)) throw new InvalidLayoutError();
  if ("background" in value && !object(value.background))
    throw new InvalidLayoutError();
  if ("guides" in value && !object(value.guides))
    throw new InvalidLayoutError();
  for (const key of ["buttonMappings", "stickMappings"])
    if (
      key in value &&
      (!Array.isArray(value[key]) ||
        !(value[key] as unknown[]).every(Number.isInteger))
    )
      throw new InvalidLayoutError();
}

export function parseImportedLayoutJson(text: string): Partial<Layout> {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new InvalidLayoutError();
  }
  if (object(value) && "formatVersion" in value) {
    if (value.formatVersion !== 2) throw new InvalidLayoutError();
    try {
      return deserializeLayoutDocument(value);
    } catch {
      throw new InvalidLayoutError();
    }
  }
  validateImportedLayout(value);
  return value;
}
