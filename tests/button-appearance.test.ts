import assert from "node:assert/strict";
import test from "node:test";
import {
  inheritsDefaultFlag,
  inheritsDefaultText,
  resolveButtonAppearance,
} from "../src/button-appearance";
import { createDefaultLayout } from "../src/layout";
import type { ButtonLayout } from "../src/types";

function defaults(overrides: Partial<ButtonLayout> = {}): ButtonLayout {
  return { ...createDefaultLayout().defaultbuttons, ...overrides };
}

test("resolveButtonAppearance prefers a button's own value over the default", () => {
  const appearance = resolveButtonAppearance(
    { cssColor: "#abcdef", cssTextSize: "32" },
    defaults({ cssColor: "#112233", cssTextSize: "20" }),
  );

  assert.equal(appearance.color, "#abcdef");
  assert.equal(appearance.textSize, "32");
});

test("resolveButtonAppearance falls back to the default, then to a built-in value", () => {
  const appearance = resolveButtonAppearance(
    {},
    defaults({ cssTextColor: "#eeeeee" }),
  );

  assert.equal(appearance.textColor, "#eeeeee");
  assert.equal(appearance.textOutlineColor, "#000000");
});

test("resolveButtonAppearance treats a blank value as unset", () => {
  const appearance = resolveButtonAppearance(
    { cssColor: "" },
    defaults({ cssColor: "#112233" }),
  );

  assert.equal(appearance.color, "#112233");
});

test("resolveButtonAppearance keeps a false flag instead of inheriting it", () => {
  const appearance = resolveButtonAppearance(
    { cssTextBold: false },
    defaults({ cssTextBold: true }),
  );

  assert.equal(appearance.textBold, false);
});

test("resolveButtonAppearance matches the border to the color when no border color is set", () => {
  const withoutBorder = defaults();
  delete withoutBorder.cssBorderColor;
  delete withoutBorder.cssBorderMatchesColor;

  const appearance = resolveButtonAppearance(
    { cssColor: "#abcdef", cssPressedColor: "#123456" },
    withoutBorder,
  );

  assert.equal(appearance.borderMatchesColor, true);
  assert.equal(appearance.borderColor, "#abcdef");
  assert.equal(appearance.pressedBorderColor, "#123456");
});

test("resolveButtonAppearance stops matching once a button sets its own border color", () => {
  const withoutBorder = defaults();
  delete withoutBorder.cssBorderColor;
  delete withoutBorder.cssBorderMatchesColor;

  const appearance = resolveButtonAppearance(
    { cssColor: "#abcdef", cssBorderColor: "#112233" },
    withoutBorder,
  );

  assert.equal(appearance.borderMatchesColor, false);
  assert.equal(appearance.borderColor, "#112233");
});

test("resolveButtonAppearance falls back from the pressed border color to the pressed color", () => {
  const appearance = resolveButtonAppearance(
    {
      cssBorderMatchesColor: false,
      cssBorderColor: "#112233",
      cssPressedColor: "#654321",
    },
    defaults(),
  );

  assert.equal(appearance.pressedBorderColor, "#654321");
});

test("inheritsDefaultText reports blank and matching values as inherited", () => {
  assert.equal(inheritsDefaultText(undefined, "#112233"), true);
  assert.equal(inheritsDefaultText("", "#112233"), true);
  assert.equal(inheritsDefaultText("#112233", "#112233"), true);
  assert.equal(inheritsDefaultText("#abcdef", "#112233"), false);
});

test("inheritsDefaultFlag reports only unset flags as inherited by default", () => {
  assert.equal(inheritsDefaultFlag(undefined), true);
  assert.equal(inheritsDefaultFlag(false), false);
  assert.equal(inheritsDefaultFlag(false, false), true);
  assert.equal(inheritsDefaultFlag(true, false), false);
});
