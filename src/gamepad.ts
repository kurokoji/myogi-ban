import { decodeAxisMapping, encodeAxisMapping } from "./axis-mapping";
import { TOTAL_BUTTONS } from "./types";

export type ButtonMapping = number; // 0-51: button index, 1000000+: axis code

export function assignmentCodeFromInput(
  buttonPress: number | null,
  axisInput: { axis: number; value: number } | null,
): number | null {
  if (buttonPress !== null) return buttonPress;
  return axisInput
    ? encodeAxisMapping({ axis: axisInput.axis, value: axisInput.value })
    : null;
}
export type StickMapping = number;
export const UNASSIGNED_MAPPING = -1;

export function toggleMappingAssignment(
  buttonMappings: ButtonMapping[],
  stickMappings: StickMapping[],
  target: { type: "button" | "stick"; index: number },
  code: number,
): { buttonMappings: ButtonMapping[]; stickMappings: StickMapping[] } {
  const currentMapping =
    target.type === "button"
      ? buttonMappings[target.index]
      : stickMappings[target.index];
  if (currentMapping === code) {
    const nextButtons = [...buttonMappings];
    const nextStick = [...stickMappings];
    if (target.type === "button") {
      nextButtons[target.index] = UNASSIGNED_MAPPING;
    } else {
      nextStick[target.index] = UNASSIGNED_MAPPING;
    }
    return { buttonMappings: nextButtons, stickMappings: nextStick };
  }

  const nextButtons = [...buttonMappings];
  const nextStick = [...stickMappings];
  if (target.type === "button") nextButtons[target.index] = code;
  else nextStick[target.index] = code;
  return { buttonMappings: nextButtons, stickMappings: nextStick };
}

export class GamepadManager {
  private activeGamepadIndex: number = -1;
  private axesCenter: number[] = [];
  private onConnectCallback: ((gamepad: Gamepad) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private readonly handleConnected = (event: GamepadEvent): void => {
    if (this.activeGamepadIndex === -1) {
      this.activeGamepadIndex = event.gamepad.index;
      this.axesCenter = [...event.gamepad.axes];
      this.onConnectCallback?.(event.gamepad);
    }
  };
  private readonly handleDisconnected = (event: GamepadEvent): void => {
    if (event.gamepad.index === this.activeGamepadIndex) {
      this.activeGamepadIndex = -1;
      this.axesCenter = [];
      this.onDisconnectCallback?.();
    }
  };

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener("gamepadconnected", this.handleConnected);
    window.addEventListener("gamepaddisconnected", this.handleDisconnected);
  }

  dispose(): void {
    window.removeEventListener("gamepadconnected", this.handleConnected);
    window.removeEventListener("gamepaddisconnected", this.handleDisconnected);
    this.onConnectCallback = null;
    this.onDisconnectCallback = null;
  }

  onConnect(callback: (gamepad: Gamepad) => void): void {
    this.onConnectCallback = callback;
  }

  onDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  isConnected(): boolean {
    return this.activeGamepadIndex !== -1;
  }

  getGamepad(): Gamepad | null {
    if (this.activeGamepadIndex === -1) return null;
    return navigator.getGamepads()[this.activeGamepadIndex] || null;
  }

  pollConnection(): void {
    if (this.activeGamepadIndex === -1) {
      const gamepads = navigator.getGamepads();
      for (const gp of gamepads) {
        if (gp) {
          this.activeGamepadIndex = gp.index;
          this.axesCenter = [...gp.axes];
          this.onConnectCallback?.(gp);
          break;
        }
      }
    }
  }

  isButtonPressed(mapping: ButtonMapping, gamepad: Gamepad): boolean {
    if (mapping === UNASSIGNED_MAPPING) return false;
    if (mapping >= 1000000) {
      return this.isAxisTriggered(mapping, gamepad);
    }
    return (
      mapping >= 0 &&
      mapping < gamepad.buttons.length &&
      gamepad.buttons[mapping].pressed
    );
  }

  private isAxisTriggered(code: number, gamepad: Gamepad): boolean {
    const mapping = decodeAxisMapping(code);
    if (!mapping) return false;
    const { axis, value: val } = mapping;
    const sign = val < 0 ? -1 : 1;

    if (axis >= gamepad.axes.length) return false;

    const gamepadAxis = gamepad.axes[axis];
    const min = (val - (this.axesCenter[axis] || 0)) * 0.55;
    const max = val + 0.05 * sign;
    const realMin = Math.min(min, max);
    const realMax = Math.max(min, max);

    return gamepadAxis >= realMin && gamepadAxis <= realMax;
  }

  detectButtonPress(): number | null {
    const gamepad = this.getGamepad();
    if (!gamepad) return null;

    for (let i = 0; i < gamepad.buttons.length; i++) {
      if (gamepad.buttons[i].pressed) return i;
    }
    return null;
  }

  detectAxisHold(): { axis: number; value: number } | null {
    const gamepad = this.getGamepad();
    if (!gamepad) return null;

    for (let i = 0; i < gamepad.axes.length; i++) {
      const val = gamepad.axes[i];
      if (Math.abs(val - (this.axesCenter[i] || 0)) > 0.3) {
        return { axis: i, value: val };
      }
    }
    return null;
  }

  static axisToCode(axis: number, value: number): number {
    return encodeAxisMapping({ axis, value });
  }

  static createDefaultButtonMappings(): ButtonMapping[] {
    const mappings: ButtonMapping[] = [];
    for (let i = 0; i < TOTAL_BUTTONS; i++) {
      mappings.push(i);
    }
    // 標準的な格ゲーコンの割り当て
    mappings[0] = 1;
    mappings[1] = 2;
    mappings[2] = 3;
    mappings[3] = 6;
    mappings[4] = 0;
    mappings[5] = 4;
    mappings[6] = 5;
    return mappings;
  }

  static createDefaultStickMappings(): StickMapping[] {
    return [12, 13, 14, 15]; // Up, Down, Left, Right
  }
}
