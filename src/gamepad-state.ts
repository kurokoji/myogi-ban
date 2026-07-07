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

  if (layout.inputhistorymode.toggle && statusChanged) {
    let direction = 0;
    if (stickStatus[0] && stickStatus[2]) direction = 1005;
    else if (stickStatus[1] && stickStatus[2]) direction = 1006;
    else if (stickStatus[0] && stickStatus[3]) direction = 1007;
    else if (stickStatus[1] && stickStatus[3]) direction = 1008;
    else if (stickStatus[0]) direction = 1001;
    else if (stickStatus[1]) direction = 1002;
    else if (stickStatus[2]) direction = 1003;
    else if (stickStatus[3]) direction = 1004;

    if (direction > 0) inputs.push(direction);
  }

  return { stickClass, stickStatus, pressedButtons, inputs, statusChanged };
}
