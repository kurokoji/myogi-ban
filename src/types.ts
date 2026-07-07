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
}

export interface StickLayout {
  x: string;
  y: string;
  w: string;
  h: string;
}

export interface BackgroundConfig {
  show: boolean;
  image: string;
  scale: string;
  w: string;
  h: string;
}

export interface InputHistoryMode {
  toggle: boolean;
  direction: number;
  count: number;
  game: string;
  btnmapping: string[];
}

export interface Layout {
  version: string;
  name: string;
  inputhistorymode: InputHistoryMode;
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
  input: number[];
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

export const STICK_NAMES = ["stick-up", "stick-down", "stick-left", "stick-right"] as const;
export const DPAD_NAMES = ["Up", "Down", "Left", "Right"] as const;
export const TOTAL_BUTTONS = 52;
export const PORT = 33770;
export const SERVER_URL = `http://localhost:${PORT}`;
