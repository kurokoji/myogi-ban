/**
 * Controller state in the W3C "standard" Gamepad layout, so assignments made
 * with the browser Gamepad API keep working when input comes from the server.
 */
export interface InputFrame {
  buttons: boolean[];
  axes: number[];
}

/** Emits the active controller's state; null means no controller. */
export interface NativeInputSource {
  subscribe(listener: (frame: InputFrame | null) => void): () => void;
}

export interface NativeGamepadState {
  buttons: Record<string, boolean | undefined>;
  axes: Record<string, number | undefined>;
}

const STANDARD_BUTTON_NAMES = [
  "a",
  "b",
  "x",
  "y",
  "leftShoulder",
  "rightShoulder",
  "leftTrigger",
  "rightTrigger",
  "back",
  "start",
  "leftStick",
  "rightStick",
  "dpadUp",
  "dpadDown",
  "dpadLeft",
  "dpadRight",
  "guide",
] as const;

const STANDARD_AXIS_NAMES = [
  "leftStickX",
  "leftStickY",
  "rightStickX",
  "rightStickY",
] as const;

/**
 * Triggers are analog in SDL but buttons in the standard layout. Some
 * controllers report 0.5 for a released trigger, so the threshold sits well
 * above that.
 */
const TRIGGER_PRESSED_THRESHOLD = 0.75;
const TRIGGER_NAMES = new Set(["leftTrigger", "rightTrigger"]);

function isButtonPressed(state: NativeGamepadState, name: string): boolean {
  if (TRIGGER_NAMES.has(name)) {
    return (state.axes[name] ?? 0) > TRIGGER_PRESSED_THRESHOLD;
  }
  return state.buttons[name] === true;
}

export function inputFrameFromNativeGamepad(
  state: NativeGamepadState,
): InputFrame {
  return {
    buttons: STANDARD_BUTTON_NAMES.map((name) => isButtonPressed(state, name)),
    axes: STANDARD_AXIS_NAMES.map((name) => state.axes[name] ?? 0),
  };
}
