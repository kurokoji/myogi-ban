import { MAX_VISIBLE_BUTTONS } from "../app-constants";
import { createDefaultButtonLayout, ensureLayoutDefaults } from "../layout";
import type {
  BackgroundConfig,
  ButtonLayout,
  ButtonShape,
  Layout,
  StickLayout,
} from "../types";
import { TOTAL_BUTTONS } from "../types";

export const CURRENT_LAYOUT_FORMAT_VERSION = 2;

interface PositionDocument {
  x?: number;
  y?: number;
}

interface SizeDocument {
  width?: number;
  height?: number;
}

interface ButtonDocument {
  position: PositionDocument;
  size: SizeDocument;
  pressedPosition: PositionDocument;
  pressedSize: SizeDocument;
  releasedImage?: string;
  pressedImage?: string;
  rotation?: number;
  useCss?: boolean;
  color?: string;
  pressedColor?: string;
  transitionSeconds?: number;
  easing?: string;
  shape?: ButtonShape;
}

interface StickDocument {
  visible: boolean;
  position: PositionDocument;
  size: SizeDocument;
  color?: string;
  plateColor?: string;
  transitionSeconds?: number;
  easing?: string;
}

interface BackgroundDocument {
  visible: boolean;
  opacity: number;
  image?: string;
  scale?: number;
  size: SizeDocument;
  useCss?: boolean;
  color?: string;
  borderRadius?: number;
}

export interface LayoutDocumentV2 {
  formatVersion: 2;
  name: string;
  stick: StickDocument;
  buttonDefaults: ButtonDocument;
  buttons: ButtonDocument[];
  background: BackgroundDocument;
  guides: {
    vertical: number[];
    horizontal: number[];
  };
  mappings: {
    buttons: number[];
    stick: number[];
  };
}

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function hasOptionalType(
  value: Record<string, unknown>,
  key: string,
  type: "string" | "boolean" | "number",
): boolean {
  return value[key] === undefined || typeof value[key] === type;
}

function validPoint(value: unknown): boolean {
  return (
    record(value) &&
    hasOptionalType(value, "x", "number") &&
    hasOptionalType(value, "y", "number")
  );
}

function validSize(value: unknown): boolean {
  return (
    record(value) &&
    hasOptionalType(value, "width", "number") &&
    hasOptionalType(value, "height", "number")
  );
}

function validButton(value: unknown): boolean {
  if (!record(value)) return false;
  return (
    validPoint(value.position) &&
    validSize(value.size) &&
    validPoint(value.pressedPosition) &&
    validSize(value.pressedSize) &&
    ["releasedImage", "pressedImage", "color", "pressedColor", "easing"].every(
      (key) => hasOptionalType(value, key, "string"),
    ) &&
    ["rotation", "transitionSeconds"].every((key) =>
      hasOptionalType(value, key, "number"),
    ) &&
    hasOptionalType(value, "useCss", "boolean") &&
    (value.shape === undefined ||
      ["circle", "pill", "rounded", "square"].includes(String(value.shape)))
  );
}

function numericArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every(Number.isInteger);
}

export function isLayoutDocumentV2(value: unknown): value is LayoutDocumentV2 {
  if (!record(value) || value.formatVersion !== 2) return false;
  if (typeof value.name !== "string" || !validButton(value.buttonDefaults))
    return false;
  if (
    !Array.isArray(value.buttons) ||
    value.buttons.length > MAX_VISIBLE_BUTTONS ||
    !value.buttons.every(validButton)
  )
    return false;
  if (
    !record(value.stick) ||
    typeof value.stick.visible !== "boolean" ||
    !validPoint(value.stick.position) ||
    !validSize(value.stick.size)
  )
    return false;
  if (
    !record(value.background) ||
    typeof value.background.visible !== "boolean" ||
    typeof value.background.opacity !== "number" ||
    !validSize(value.background.size)
  )
    return false;
  if (
    !record(value.guides) ||
    !numericArray(value.guides.vertical) ||
    !numericArray(value.guides.horizontal)
  )
    return false;
  return (
    record(value.mappings) &&
    numericArray(value.mappings.buttons) &&
    numericArray(value.mappings.stick)
  );
}

function numeric(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function text(value: number | undefined): string {
  return value === undefined ? "" : String(value);
}

function buttonDocument(button: ButtonLayout): ButtonDocument {
  return {
    position: { x: numeric(button.x), y: numeric(button.y) },
    size: { width: numeric(button.w), height: numeric(button.h) },
    pressedPosition: { x: numeric(button.xp), y: numeric(button.yp) },
    pressedSize: { width: numeric(button.wp), height: numeric(button.hp) },
    releasedImage: button.img || undefined,
    pressedImage: button.imgp || undefined,
    rotation: numeric(button.rotation),
    useCss: button.useCss,
    color: button.cssColor,
    pressedColor: button.cssPressedColor,
    transitionSeconds: numeric(button.cssTransition),
    easing: button.cssEasing,
    shape: button.cssShape,
  };
}

function buttonOverrideDocument(
  button: ButtonLayout,
  defaults: ButtonLayout,
): ButtonDocument {
  const document = buttonDocument(button);
  const defaultDocument = buttonDocument(defaults);
  for (const key of [
    "releasedImage",
    "pressedImage",
    "rotation",
    "useCss",
    "color",
    "pressedColor",
    "transitionSeconds",
    "easing",
    "shape",
  ] as const) {
    if (document[key] === defaultDocument[key]) delete document[key];
  }
  return document;
}

function stickDocument(stick: StickLayout, visible: boolean): StickDocument {
  return {
    visible,
    position: { x: numeric(stick.x), y: numeric(stick.y) },
    size: { width: numeric(stick.w), height: numeric(stick.h) },
    color: stick.cssColor,
    plateColor: stick.cssPlateColor,
    transitionSeconds: numeric(stick.cssTransition),
    easing: stick.cssEasing,
  };
}

function backgroundDocument(background: BackgroundConfig): BackgroundDocument {
  return {
    visible: background.show,
    opacity: background.opacity,
    image: background.image || undefined,
    scale: numeric(background.scale),
    size: { width: numeric(background.w), height: numeric(background.h) },
    useCss: background.useCss,
    color: background.cssColor,
    borderRadius: background.cssBorderRadius,
  };
}

export function serializeLayoutDocument(layout: Layout): LayoutDocumentV2 {
  return {
    formatVersion: CURRENT_LAYOUT_FORMAT_VERSION,
    name: layout.name,
    stick: stickDocument(layout.stick, layout.showstick),
    buttonDefaults: buttonDocument(layout.defaultbuttons),
    buttons: layout.buttons
      .slice(0, layout.totalbuttonshow)
      .map((button) => buttonOverrideDocument(button, layout.defaultbuttons)),
    background: backgroundDocument(layout.background),
    guides: {
      vertical: [...layout.guides.vertical],
      horizontal: [...layout.guides.horizontal],
    },
    mappings: {
      buttons: (layout.buttonMappings || []).slice(0, layout.totalbuttonshow),
      stick: [...(layout.stickMappings || [])],
    },
  };
}

function runtimeButton(button: ButtonDocument): ButtonLayout {
  return {
    x: text(button.position.x),
    y: text(button.position.y),
    w: text(button.size.width),
    h: text(button.size.height),
    xp: text(button.pressedPosition.x),
    yp: text(button.pressedPosition.y),
    wp: text(button.pressedSize.width),
    hp: text(button.pressedSize.height),
    img: button.releasedImage || "",
    imgp: button.pressedImage || "",
    rotation:
      button.rotation === undefined ? undefined : String(button.rotation),
    useCss: button.useCss,
    cssColor: button.color,
    cssPressedColor: button.pressedColor,
    cssTransition:
      button.transitionSeconds === undefined
        ? undefined
        : String(button.transitionSeconds),
    cssEasing: button.easing,
    cssShape: button.shape,
  };
}

export function deserializeLayoutDocumentV2(
  document: LayoutDocumentV2,
): Layout {
  if (!isLayoutDocumentV2(document)) throw new Error("Invalid v2 layout");
  const buttons = document.buttons.map(runtimeButton);
  while (buttons.length < TOTAL_BUTTONS)
    buttons.push(createDefaultButtonLayout());
  return ensureLayoutDefaults({
    sourceFormatVersion: 2,
    name: document.name,
    totalbuttonshow: document.buttons.length,
    showstick: document.stick.visible,
    stick: {
      x: text(document.stick.position.x),
      y: text(document.stick.position.y),
      w: text(document.stick.size.width),
      h: text(document.stick.size.height),
      cssColor: document.stick.color,
      cssPlateColor: document.stick.plateColor,
      cssTransition:
        document.stick.transitionSeconds === undefined
          ? undefined
          : String(document.stick.transitionSeconds),
      cssEasing: document.stick.easing,
    },
    defaultbuttons: runtimeButton(document.buttonDefaults),
    buttons,
    background: {
      show: document.background.visible,
      opacity: document.background.opacity,
      image: document.background.image || "",
      scale: text(document.background.scale),
      w: text(document.background.size.width),
      h: text(document.background.size.height),
      useCss: document.background.useCss,
      cssColor: document.background.color,
      cssBorderRadius: document.background.borderRadius,
    },
    guides: {
      vertical: [...document.guides.vertical],
      horizontal: [...document.guides.horizontal],
    },
    buttonMappings: [...document.mappings.buttons],
    stickMappings: [...document.mappings.stick],
  });
}
