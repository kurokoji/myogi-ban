import type { ButtonLayout, Layout } from "./types";

export type EditorLayoutUpdater = (updater: (layout: Layout) => void) => void;
export type AssigningTarget = number | null;
export type ImageUploadTarget =
  | { type: "background" }
  | { type: "defaultButton"; state: "released" | "pressed" }
  | { type: "button"; indexes: number[]; state: "released" | "pressed" };

const BULK_EDITABLE_BUTTON_KEYS: Array<keyof ButtonLayout> = [
  "w",
  "h",
  "img",
  "xp",
  "yp",
  "wp",
  "hp",
  "imgp",
  "rotation",
  "useCss",
  "cssColor",
  "cssPressedColor",
  "cssTransition",
  "cssEasing",
  "cssShape",
  "text",
  "cssTextColor",
  "cssTextSize",
  "cssTextBold",
  "cssTextItalic",
  "cssTextOutline",
  "cssTextOutlineColor",
];

export function updateSelectedButtonSettings(
  layout: Layout,
  selectedIndexes: number[],
  updater: (layout: Layout) => void,
): void {
  const primaryIndex = selectedIndexes[0];
  if (primaryIndex === undefined) return;
  if (!layout.buttons[primaryIndex]) {
    layout.buttons[primaryIndex] = createEmptyButtonLayout();
  }
  const before = { ...layout.buttons[primaryIndex] };
  updater(layout);
  const after = layout.buttons[primaryIndex];
  const changedKeys = BULK_EDITABLE_BUTTON_KEYS.filter(
    (key) => before[key] !== after[key],
  );

  for (const index of selectedIndexes.slice(1)) {
    if (!layout.buttons[index]) {
      layout.buttons[index] = createEmptyButtonLayout();
    }
    for (const key of changedKeys) {
      if (after[key] === undefined) {
        delete layout.buttons[index][key];
      } else {
        Object.assign(layout.buttons[index], { [key]: after[key] });
      }
    }
  }
}

export function cloneLayout(layout: Layout): Layout {
  return {
    ...layout,
    stick: { ...layout.stick },
    defaultbuttons: { ...layout.defaultbuttons },
    background: { ...layout.background },
    buttons: layout.buttons.map((button) => ({ ...button })),
    guides: {
      vertical: [...layout.guides.vertical],
      horizontal: [...layout.guides.horizontal],
    },
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

export function isStickAssignmentTarget(target: AssigningTarget): boolean {
  return target !== null && target >= 1000;
}

export function layoutNameFromSelection(selectedLayout: string): string {
  return selectedLayout.replace(/:builtin$|:user$/, "");
}

export function layoutSelectionValue(name: string, builtin: boolean): string {
  return `${name}:${builtin ? "builtin" : "user"}`;
}

export function formatDragCoordinateLabel(x: number, y: number): string {
  return `X: ${x}, Y: ${y}`;
}

export function formatDragDeltaLabel(deltaX: number, deltaY: number): string {
  const signed = (value: number) => (value >= 0 ? `+${value}` : `${value}`);
  return `ΔX: ${signed(deltaX)}, ΔY: ${signed(deltaY)}`;
}

export function formatGuideCoordinateLabel(
  axis: "x" | "y",
  value: number,
): string {
  return axis === "x" ? `X: ${value}` : `Y: ${value}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
