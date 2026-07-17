import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import { ApiClient } from "./api";
import { GamepadView } from "./components/GamepadView";
import { selectDefaultLayoutEntry } from "./default-layout";
import {
  type ButtonMapping,
  GamepadManager,
  type StickMapping,
} from "./gamepad";
import { startGamepadMonitor } from "./gamepad-monitor";
import { createEmptySnapshot, readGamepadSnapshot } from "./gamepad-state";
import { useLatestRef } from "./hooks/useLatestRef";
import { createDefaultLayout, ensureLayoutDefaults } from "./layout";
import type { Layout } from "./types";

function ViewerApp(): React.ReactElement {
  const apiRef = useRef(new ApiClient());
  const [layout, setLayout] = useState<Layout>(() => createDefaultLayout());
  const [buttonMappings, setButtonMappings] = useState<ButtonMapping[]>(() =>
    GamepadManager.createDefaultButtonMappings(),
  );
  const [stickMappings, setStickMappings] = useState<StickMapping[]>(() =>
    GamepadManager.createDefaultStickMappings(),
  );
  const [snapshot, setSnapshot] = useState(() =>
    createEmptySnapshot(createDefaultLayout()),
  );
  const layoutRef = useLatestRef(layout);
  const buttonMappingsRef = useLatestRef(buttonMappings);
  const stickMappingsRef = useLatestRef(stickMappings);

  useEffect(() => {
    Promise.all([
      apiRef.current.getDefaultLayout(),
      apiRef.current.getLayouts(),
    ])
      .then(([defaultLayout, entries]) => {
        const entry = selectDefaultLayoutEntry(
          entries,
          defaultLayout.name || "default",
        );
        return entry
          ? apiRef.current.getLayout(entry.name, entry.builtin)
          : null;
      })
      .then((data) => {
        if (data?.version) {
          const nextLayout = ensureLayoutDefaults(data);
          setLayout(nextLayout);
          setSnapshot(createEmptySnapshot(nextLayout));
          setButtonMappings(
            data.buttonMappings || GamepadManager.createDefaultButtonMappings(),
          );
          setStickMappings(
            data.stickMappings || GamepadManager.createDefaultStickMappings(),
          );
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const manager = new GamepadManager();
    manager.onDisconnect(() => {
      setSnapshot(createEmptySnapshot(layoutRef.current));
    });

    const updateLoop = () => {
      const gamepad = manager.getGamepad();
      if (gamepad) {
        const nextSnapshot = readGamepadSnapshot(
          manager,
          gamepad,
          layoutRef.current,
          buttonMappingsRef.current,
          stickMappingsRef.current,
        );
        setSnapshot(nextSnapshot);
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
  }, [buttonMappingsRef, layoutRef, stickMappingsRef]);

  return (
    <div id="container" className="container">
      <GamepadView
        layout={layout}
        stickClass={snapshot.stickClass}
        pressedButtons={snapshot.pressedButtons}
        backgroundOpacity={layout.background.opacity}
      />
    </div>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<ViewerApp />);
}
