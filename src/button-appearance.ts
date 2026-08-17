import type { ButtonLayout, ButtonShape } from "./types";

export interface ButtonAppearance {
  useCss: boolean;
  color: string;
  pressedColor: string;
  borderMatchesColor: boolean;
  borderColor: string;
  pressedBorderColor: string;
  transition: string;
  easing: string;
  shape: ButtonShape;
  rotation: string;
  textColor: string;
  textSize: string;
  textBold: boolean;
  textItalic: boolean;
  textOutline: boolean;
  textOutlineColor: string;
}

type ButtonOverrides = Partial<ButtonLayout> | undefined;

function text(
  value: string | undefined,
  defaultValue: string | undefined,
  fallback: string,
): string {
  return value || defaultValue || fallback;
}

function flag(
  value: boolean | undefined,
  defaultValue: boolean | undefined,
  fallback: boolean,
): boolean {
  return value ?? defaultValue ?? fallback;
}

/**
 * A border matches the button color until someone sets a border color, so
 * layouts saved before the border color existed keep their original look.
 */
export function resolveBorderMatchesColor(
  button: ButtonOverrides,
  defaults: ButtonLayout,
): boolean {
  const defaultMatches =
    defaults.cssBorderMatchesColor ?? defaults.cssBorderColor === undefined;
  return (
    button?.cssBorderMatchesColor ??
    (button?.cssBorderColor === undefined ? defaultMatches : false)
  );
}

export function resolveButtonAppearance(
  button: ButtonOverrides,
  defaults: ButtonLayout,
): ButtonAppearance {
  const color = text(button?.cssColor, defaults.cssColor, "#cccccc");
  const pressedColor = text(
    button?.cssPressedColor,
    defaults.cssPressedColor,
    "#999999",
  );
  const borderMatchesColor = resolveBorderMatchesColor(button, defaults);
  const borderColor = borderMatchesColor
    ? color
    : text(button?.cssBorderColor, defaults.cssBorderColor, color);
  return {
    useCss: flag(button?.useCss, defaults.useCss, false),
    color,
    pressedColor,
    borderMatchesColor,
    borderColor,
    pressedBorderColor: borderMatchesColor
      ? pressedColor
      : text(
          button?.cssPressedBorderColor,
          defaults.cssPressedBorderColor,
          pressedColor,
        ),
    transition: text(button?.cssTransition, defaults.cssTransition, "0.02"),
    easing: text(button?.cssEasing, defaults.cssEasing, "ease"),
    shape: button?.cssShape ?? defaults.cssShape ?? "circle",
    rotation: text(button?.rotation, defaults.rotation, "0"),
    textColor: text(button?.cssTextColor, defaults.cssTextColor, "#ffffff"),
    textSize: text(button?.cssTextSize, defaults.cssTextSize, "14"),
    textBold: flag(button?.cssTextBold, defaults.cssTextBold, false),
    textItalic: flag(button?.cssTextItalic, defaults.cssTextItalic, false),
    textOutline: flag(button?.cssTextOutline, defaults.cssTextOutline, false),
    textOutlineColor: text(
      button?.cssTextOutlineColor,
      defaults.cssTextOutlineColor,
      "#000000",
    ),
  };
}

export function resolveDefaultButtonAppearance(
  defaults: ButtonLayout,
): ButtonAppearance {
  return resolveButtonAppearance(defaults, defaults);
}

/** A blank or default-matching text value still follows the default button. */
export function inheritsDefaultText(
  value: string | undefined,
  defaultValue: string | undefined,
): boolean {
  return !value || value === defaultValue;
}

/** An unset flag follows the default button; pass a default to also compare. */
export function inheritsDefaultFlag(
  value: boolean | undefined,
  defaultValue?: boolean,
): boolean {
  return value === undefined || value === defaultValue;
}
