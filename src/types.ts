export type ButtonShape = "circle" | "rounded" | "square";

export interface ButtonLayout {
  x: string;
  y: string;
  w: string;
  h: string;
  img: string;
  xp: string;
  yp: string;
  wp: string;
  hp: string;
  imgp: string;
  rotation?: string;
  useCss?: boolean;
  cssColor?: string;
  cssPressedColor?: string;
  cssTransition?: string;
  cssEasing?: string;
  cssShape?: ButtonShape;
}

export interface StickLayout {
  x: string;
  y: string;
  w: string;
  h: string;
  useCss?: boolean;
  cssColor?: string;
  cssPlateColor?: string;
  cssTransition?: string;
  cssEasing?: string;
}

export interface BackgroundConfig {
  show: boolean;
  image: string;
  scale: string;
  w: string;
  h: string;
  useCss?: boolean;
  cssColor?: string;
  cssBorderRadius?: number;
}

export interface Layout {
  version: string;
  name: string;
  totalbuttonshow: number;
  showstick: boolean;
  stick: StickLayout;
  defaultbuttons: ButtonLayout;
  buttons: ButtonLayout[];
  background: BackgroundConfig;
  buttonMappings?: number[];
  stickMappings?: number[];
}

export interface GamepadState {
  stick: string;
  buttons: boolean[];
  connected: boolean;
  layout: Layout;
}

export interface UserSpecificConfig {
  enable: boolean;
  n: { axis: string; value: string };
  u: { axis: string; value: string };
  d: { axis: string; value: string };
  l: { axis: string; value: string };
  r: { axis: string; value: string };
  ul: { axis: string; value: string };
  dl: { axis: string; value: string };
  ur: { axis: string; value: string };
  dr: { axis: string; value: string };
  status: Array<{ axis: string; value: string }>;
}

export interface LayoutEntry {
  name: string;
  builtin: boolean;
}

export const STICK_NAMES = [
  "stick-up",
  "stick-down",
  "stick-left",
  "stick-right",
] as const;
export const DPAD_NAMES = ["Up", "Down", "Left", "Right"] as const;
export const TOTAL_BUTTONS = 52;
export const PORT = 33770;
export const SERVER_URL = `http://localhost:${PORT}`;
