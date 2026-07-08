import type { ButtonLayout, Layout } from "./types";

export type EditorLayoutUpdater = (updater: (layout: Layout) => void) => void;
export type AssigningTarget = number | null;
export type ImageUploadTarget =
  | { type: "background" }
  | { type: "defaultButton"; state: "released" | "pressed" }
  | { type: "button"; index: number; state: "released" | "pressed" };

export function cloneLayout(layout: Layout): Layout {
  return {
    ...layout,
    stick: { ...layout.stick },
    defaultbuttons: { ...layout.defaultbuttons },
    background: { ...layout.background },
    buttons: layout.buttons.map((button) => ({ ...button })),
    buttonMappings: layout.buttonMappings
      ? [...layout.buttonMappings]
      : undefined,
    stickMappings: layout.stickMappings ? [...layout.stickMappings] : undefined,
  };
}

export function createEmptyButtonLayout(): ButtonLayout {
  return {
    x: "",
    y: "",
    w: "",
    h: "",
    img: "",
    xp: "",
    yp: "",
    wp: "",
    hp: "",
    imgp: "",
  };
}

export function numericValue(value: string | number): number | string {
  const text = value === undefined || value === null ? "" : String(value);
  return text === "" ? "" : Number(text);
}

export function assignmentNameForTarget(
  target: AssigningTarget,
  buttonLabel = "Button",
  stickLabel = "Stick",
): string {
  if (target === null) return "";
  if (target < 1000) return `${buttonLabel} ${target + 1}`;
  return `${stickLabel} ${["Up", "Down", "Left", "Right"][target - 1000]}`;
}

export function layoutNameFromSelection(selectedLayout: string): string {
  return selectedLayout.replace(/:builtin$|:user$/, "");
}

export function layoutSelectionValue(name: string, builtin: boolean): string {
  return `${name}:${builtin ? "builtin" : "user"}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
