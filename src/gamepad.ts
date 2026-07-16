import { TOTAL_BUTTONS } from "./types";

export type ButtonMapping = number; // 0-51: button index, 1000000+: axis code
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

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener("gamepadconnected", (e) => {
      if (this.activeGamepadIndex === -1) {
        this.activeGamepadIndex = e.gamepad.index;
        this.axesCenter = [...e.gamepad.axes];
        this.onConnectCallback?.(e.gamepad);
      }
    });

    window.addEventListener("gamepaddisconnected", (e) => {
      if (e.gamepad.index === this.activeGamepadIndex) {
        this.activeGamepadIndex = -1;
        this.axesCenter = [];
        this.onDisconnectCallback?.();
      }
    });
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
    let sign: number;

    if (code >= 2000000) {
      sign = -1;
      code -= 2000000;
    } else {
      sign = 1;
      code -= 1000000;
    }

    const axis = Math.floor(code / 10000);
    const val = ((code - axis * 10000) * sign) / 100;

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
    const sign = value < 0 ? 2000000 : 1000000;
    const absValue = Math.abs(Math.floor(value * 100));
    return sign + axis * 10000 + absValue;
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
