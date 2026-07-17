interface GamepadMonitorOptions {
  poll: () => void;
  update: () => void;
  pollInterval?: number;
  setInterval?: (callback: () => void, delay: number) => number;
  clearInterval?: (id: number) => void;
  requestFrame?: (callback: () => void) => number;
  cancelFrame?: (id: number) => void;
}

export function startGamepadMonitor(
  options: GamepadMonitorOptions,
): () => void {
  const setTimer = options.setInterval ?? window.setInterval.bind(window);
  const clearTimer = options.clearInterval ?? window.clearInterval.bind(window);
  const requestFrame =
    options.requestFrame ?? window.requestAnimationFrame.bind(window);
  const cancelFrame =
    options.cancelFrame ?? window.cancelAnimationFrame.bind(window);
  const timer = setTimer(
    options.poll,
    options.pollInterval ?? GAMEPAD_POLL_INTERVAL_MS,
  );
  let frame = 0;
  const update = () => {
    options.update();
    frame = requestFrame(update);
  };
  frame = requestFrame(update);
  return () => {
    clearTimer(timer);
    cancelFrame(frame);
  };
}

import { GAMEPAD_POLL_INTERVAL_MS } from "./app-constants";
