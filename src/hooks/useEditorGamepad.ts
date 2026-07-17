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
  assignmentCodeFromInput,
  type ButtonMapping,
  GamepadManager,
  type StickMapping,
  toggleMappingAssignment,
} from "../gamepad";
import { startGamepadMonitor } from "../gamepad-monitor";
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

    const updateLoop = () => {
      const gamepad = manager.getGamepad();
      if (gamepad) {
        const target = assigningTargetRef.current;
        if (target !== null) {
          const code = assignmentCodeFromInput(
            manager.detectButtonPress(),
            manager.detectAxisHold(),
          );
          if (code !== null) completeAssignment(target, code);
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
    };
    const stopMonitor = startGamepadMonitor({
      poll: () => manager.pollConnection(),
      update: updateLoop,
    });

    return () => {
      stopMonitor();
      manager.dispose();
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
  }, []);

  const cancelAssignment = useCallback(() => {
    setAssigningTarget(null);
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
