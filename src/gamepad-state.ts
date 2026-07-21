import type { ButtonMapping, GamepadManager, StickMapping } from "./gamepad";
import { type GamepadState, type Layout, STICK_NAMES } from "./types";

export interface GamepadSnapshot {
  stickClass: string;
  stickStatus: boolean[];
  pressedButtons: boolean[];
  inputs: number[];
  statusChanged: boolean;
}

export function areGamepadStatesEqual(
  previous: GamepadState,
  next: GamepadState,
): boolean {
  return (
    previous.stick === next.stick &&
    previous.connected === next.connected &&
    previous.layout === next.layout &&
    previous.buttons.length === next.buttons.length &&
    previous.buttons.every((pressed, index) => pressed === next.buttons[index])
  );
}

export function gamepadStateForBroadcast(
  previous: GamepadState | null,
  next: GamepadState,
): GamepadState | null {
  return previous && areGamepadStatesEqual(previous, next) ? null : next;
}

export function createEmptySnapshot(layout: Layout): GamepadSnapshot {
  return {
    stickClass: "stick",
    stickStatus: [false, false, false, false],
    pressedButtons: Array.from({ length: layout.totalbuttonshow }, () => false),
    inputs: [],
    statusChanged: false,
  };
}

export function readGamepadSnapshot(
  gamepadManager: GamepadManager,
  gamepad: Gamepad,
  layout: Layout,
  buttonMappings: ButtonMapping[],
  stickMappings: StickMapping[],
): GamepadSnapshot {
  let stickClass = "stick";
  const stickStatus = [false, false, false, false];

  for (let i = 0; i < 4; i++) {
    if (gamepadManager.isButtonPressed(stickMappings[i], gamepad)) {
      stickClass += ` ${STICK_NAMES[i]}`;
      stickStatus[i] = true;
    }
  }

  const inputs: number[] = [];
  let statusChanged = false;
  const pressedButtons = Array.from(
    { length: layout.totalbuttonshow },
    (_, i) => {
      const pressed = gamepadManager.isButtonPressed(
        buttonMappings[i],
        gamepad,
      );
      if (pressed) {
        inputs.push(i);
        statusChanged = true;
      }
      return pressed;
    },
  );

  return { stickClass, stickStatus, pressedButtons, inputs, statusChanged };
}
