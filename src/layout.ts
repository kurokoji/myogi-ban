import {
  type BackgroundConfig,
  type ButtonLayout,
  type Layout,
  type StickLayout,
  TOTAL_BUTTONS,
} from "./types";

export function createDefaultButtonLayout(
  overrides: Partial<ButtonLayout> = {},
): ButtonLayout {
  return {
    x: "0",
    y: "0",
    w: "",
    h: "",
    img: "",
    xp: "",
    yp: "",
    wp: "",
    hp: "",
    imgp: "",
    useCss: false,
    cssColor: "#cccccc",
    cssPressedColor: "#999999",
    cssTransition: "0.02",
    cssEasing: "ease",
    ...overrides,
  };
}

export function createDefaultStickLayout(
  overrides: Partial<StickLayout> = {},
): StickLayout {
  return {
    x: "0",
    y: "0",
    w: "",
    h: "",
    useCss: false,
    cssColor: "#cccccc",
    cssPlateColor: "#888888",
    cssTransition: "0.02",
    cssEasing: "ease",
    ...overrides,
  };
}

export function createDefaultBackgroundConfig(
  overrides: Partial<BackgroundConfig> = {},
): BackgroundConfig {
  return {
    show: true,
    image: "",
    scale: "1",
    w: "",
    h: "",
    useCss: true,
    cssColor: "#0b0f14",
    cssBorderRadius: 0,
    ...overrides,
  };
}

export function createDefaultLayout(): Layout {
  const buttons: ButtonLayout[] = [
    createDefaultButtonLayout({ x: "225", y: "80" }),
    createDefaultButtonLayout({ x: "280", y: "68" }),
    createDefaultButtonLayout({ x: "335", y: "74" }),
    createDefaultButtonLayout({ x: "390", y: "86" }),
    createDefaultButtonLayout({ x: "221", y: "139" }),
    createDefaultButtonLayout({ x: "276", y: "127" }),
    createDefaultButtonLayout({ x: "331", y: "133" }),
    createDefaultButtonLayout({ x: "386", y: "145" }),
  ];

  for (let i = buttons.length; i < TOTAL_BUTTONS; i++) {
    buttons.push(createDefaultButtonLayout());
  }

  return {
    version: "v1.0.4",
    name: "default",
    totalbuttonshow: 8,
    showstick: true,
    stick: createDefaultStickLayout({
      x: "130",
      y: "105",
      w: "100",
      h: "100",
      useCss: true,
      cssColor: "#e03131",
      cssPlateColor: "#868e96",
    }),
    defaultbuttons: createDefaultButtonLayout({
      w: "48",
      h: "48",
      useCss: true,
      cssColor: "#e03131",
      cssPressedColor: "#c2251c",
      rotation: "0",
      cssTransition: "0",
      cssEasing: "linear",
      cssShape: "circle",
    }),
    buttons,
    background: createDefaultBackgroundConfig({
      cssColor: "#ffffff",
      cssBorderRadius: 20,
    }),
  };
}

export function ensureLayoutDefaults(layout: Partial<Layout>): Layout {
  const defaults = createDefaultLayout();
  const incomingBackground = layout.background as
    | Partial<BackgroundConfig>
    | undefined;
  const background = { ...defaults.background, ...(incomingBackground || {}) };
  if (
    incomingBackground &&
    !("scale" in incomingBackground) &&
    (incomingBackground.w || incomingBackground.h)
  ) {
    background.scale = "";
  }
  const incomingDefaultButtons = layout.defaultbuttons as
    | Partial<ButtonLayout>
    | undefined;
  const defaultbuttons = {
    ...defaults.defaultbuttons,
    ...(incomingDefaultButtons || {}),
  };

  const buttons = (layout.buttons || defaults.buttons).map((button) => {
    const b = { ...button };
    if (b.w === defaultbuttons.w) b.w = "";
    if (b.h === defaultbuttons.h) b.h = "";
    if (b.img === defaultbuttons.img) b.img = "";
    if (b.imgp === defaultbuttons.imgp) b.imgp = "";
    if (b.rotation === defaultbuttons.rotation) delete b.rotation;
    if (b.cssShape === defaultbuttons.cssShape) delete b.cssShape;
    return b;
  });

  return {
    ...defaults,
    ...layout,
    stick: { ...defaults.stick, ...(layout.stick || {}) },
    defaultbuttons,
    background,
    buttons,
  };
}
