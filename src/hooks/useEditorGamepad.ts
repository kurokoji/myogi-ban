import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ApiClient } from "../api";
import {
  type AssigningTarget,
  assignmentNameForTarget,
} from "../editor-helpers";
import {
  type ButtonMapping,
  GamepadManager,
  type StickMapping,
  toggleMappingAssignment,
} from "../gamepad";
import { createEmptySnapshot, readGamepadSnapshot } from "../gamepad-state";
import type { GamepadState, Layout } from "../types";
import { useLatestRef } from "./useLatestRef";

interface UseEditorGamepadOptions {
  api: ApiClient;
  layout: Layout;
  buttonMappings: ButtonMapping[];
  stickMappings: StickMapping[];
  setButtonMappings: Dispatch<SetStateAction<ButtonMapping[]>>;
  setStickMappings: Dispatch<SetStateAction<StickMapping[]>>;
  buttonLabel: string;
  stickLabel: string;
}

export function useEditorGamepad(options: UseEditorGamepadOptions) {
  const {
    api,
    layout,
    buttonMappings,
    stickMappings,
    setButtonMappings,
    setStickMappings,
    buttonLabel,
    stickLabel,
  } = options;
  const gamepadRef = useRef<GamepadManager | null>(null);
  const axisHoldCounterRef = useRef(0);
  const axisHoldTargetRef = useRef<{ axis: number; value: number } | null>(
    null,
  );
  const [connected, setConnected] = useState(false);
  const [gamepadName, setGamepadName] = useState("");
  const [snapshot, setSnapshot] = useState(() => createEmptySnapshot(layout));
  const [assigningTarget, setAssigningTarget] = useState<AssigningTarget>(null);
  const layoutRef = useLatestRef(layout);
  const buttonMappingsRef = useLatestRef(buttonMappings);
  const stickMappingsRef = useLatestRef(stickMappings);
  const assigningTargetRef = useLatestRef(assigningTarget);

  const resetSnapshot = useCallback((nextLayout: Layout) => {
    setSnapshot(createEmptySnapshot(nextLayout));
  }, []);

  const completeAssignment = useCallback(
    (target: number, code: number) => {
      const mappings = toggleMappingAssignment(
        buttonMappingsRef.current,
        stickMappingsRef.current,
        target < 1000
          ? { type: "button", index: target }
          : { type: "stick", index: target - 1000 },
        code,
      );
      setButtonMappings(mappings.buttonMappings);
      setStickMappings(mappings.stickMappings);

      setAssigningTarget(null);
      axisHoldCounterRef.current = 0;
      axisHoldTargetRef.current = null;
    },
    [buttonMappingsRef, setButtonMappings, setStickMappings, stickMappingsRef],
  );

  useEffect(() => {
    const manager = new GamepadManager();
    gamepadRef.current = manager;
    manager.onConnect((gamepad) => {
      setConnected(true);
      setGamepadName(gamepad.id);
    });
    manager.onDisconnect(() => {
      setConnected(false);
      setGamepadName("");
      setSnapshot(createEmptySnapshot(layoutRef.current));
    });

    const pollTimer = window.setInterval(() => manager.pollConnection(), 100);
    let frame = 0;
    const updateLoop = () => {
      const gamepad = manager.getGamepad();
      if (gamepad) {
        const target = assigningTargetRef.current;
        if (target !== null) {
          const buttonPress = manager.detectButtonPress();
          if (buttonPress !== null) {
            completeAssignment(target, buttonPress);
          } else {
            const axisHold = manager.detectAxisHold();
            if (
              axisHold &&
              axisHoldTargetRef.current &&
              axisHoldTargetRef.current.axis === axisHold.axis &&
              Math.abs(axisHoldTargetRef.current.value - axisHold.value) < 0.1
            ) {
              axisHoldCounterRef.current += 1;
              if (axisHoldCounterRef.current >= 60) {
                completeAssignment(
                  target,
                  GamepadManager.axisToCode(axisHold.axis, axisHold.value),
                );
              }
            } else if (axisHold) {
              axisHoldTargetRef.current = axisHold;
              axisHoldCounterRef.current = 1;
            } else {
              axisHoldTargetRef.current = null;
              axisHoldCounterRef.current = 0;
            }
          }
        } else {
          const nextSnapshot = readGamepadSnapshot(
            manager,
            gamepad,
            layoutRef.current,
            buttonMappingsRef.current,
            stickMappingsRef.current,
          );
          setSnapshot(nextSnapshot);

          const state: GamepadState = {
            stick: nextSnapshot.stickClass,
            buttons: nextSnapshot.pressedButtons,
            connected: true,
            layout: layoutRef.current,
          };
          api.sendState(state);
        }
      }
      frame = window.requestAnimationFrame(updateLoop);
    };
    frame = window.requestAnimationFrame(updateLoop);

    return () => {
      window.clearInterval(pollTimer);
      window.cancelAnimationFrame(frame);
    };
  }, [
    api,
    assigningTargetRef,
    buttonMappingsRef,
    completeAssignment,
    layoutRef,
    stickMappingsRef,
  ]);

  const startAssignment = useCallback((target: number) => {
    setAssigningTarget(target);
    axisHoldCounterRef.current = 0;
    axisHoldTargetRef.current = null;
  }, []);

  const cancelAssignment = useCallback(() => {
    setAssigningTarget(null);
    axisHoldCounterRef.current = 0;
    axisHoldTargetRef.current = null;
  }, []);

  return {
    assigningTarget,
    assignmentName: assignmentNameForTarget(
      assigningTarget,
      buttonLabel,
      stickLabel,
    ),
    cancelAssignment,
    connected,
    gamepadName,
    resetSnapshot,
    snapshot,
    startAssignment,
  };
}
