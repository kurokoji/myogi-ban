import { Layout, STICK_NAMES } from './types';
import { GamepadManager, ButtonMapping, StickMapping } from './gamepad';

export interface GamepadSnapshot {
  stickClass: string;
  stickStatus: boolean[];
  pressedButtons: boolean[];
  inputs: number[];
  statusChanged: boolean;
}

export function createEmptySnapshot(layout: Layout): GamepadSnapshot {
  return {
    stickClass: 'stick',
    stickStatus: [false, false, false, false],
    pressedButtons: Array.from({ length: layout.totalbuttonshow }, () => false),
    inputs: [],
    statusChanged: false
  };
}

export function readGamepadSnapshot(
  gamepadManager: GamepadManager,
  gamepad: Gamepad,
  layout: Layout,
  buttonMappings: ButtonMapping[],
  stickMappings: StickMapping[]
): GamepadSnapshot {
  let stickClass = 'stick';
  const stickStatus = [false, false, false, false];

  for (let i = 0; i < 4; i++) {
    if (gamepadManager.isButtonPressed(stickMappings[i], gamepad)) {
      stickClass += ` ${STICK_NAMES[i]}`;
      stickStatus[i] = true;
    }
  }

  const inputs: number[] = [];
  let statusChanged = false;
  const pressedButtons = Array.from({ length: layout.totalbuttonshow }, (_, i) => {
    const pressed = gamepadManager.isButtonPressed(buttonMappings[i], gamepad);
    if (pressed) {
      inputs.push(i);
      statusChanged = true;
    }
    return pressed;
  });

  return { stickClass, stickStatus, pressedButtons, inputs, statusChanged };
}
