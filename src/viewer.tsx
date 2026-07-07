import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './i18n';
import { ApiClient } from './api';
import { GamepadManager, ButtonMapping, StickMapping } from './gamepad';
import { createDefaultLayout, ensureLayoutDefaults } from './layout';
import { Layout } from './types';
import { createEmptySnapshot, readGamepadSnapshot } from './gamepad-state';
import { GamepadView } from './components/GamepadView';

function useLatestRef<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function ViewerApp(): React.ReactElement {
  const apiRef = useRef(new ApiClient());
  const [layout, setLayout] = useState<Layout>(() => createDefaultLayout());
  const [buttonMappings, setButtonMappings] = useState<ButtonMapping[]>(() => GamepadManager.createDefaultButtonMappings());
  const [stickMappings, setStickMappings] = useState<StickMapping[]>(() => GamepadManager.createDefaultStickMappings());
  const [connected, setConnected] = useState(false);
  const [snapshot, setSnapshot] = useState(() => createEmptySnapshot(createDefaultLayout()));
  const [inputHistory, setInputHistory] = useState<number[][]>([]);
  const layoutRef = useLatestRef(layout);
  const buttonMappingsRef = useLatestRef(buttonMappings);
  const stickMappingsRef = useLatestRef(stickMappings);

  useEffect(() => {
    apiRef.current.getDefaultLayout()
      .then((defaultLayout) => {
        const layoutName = defaultLayout.name || 'preset';
        return apiRef.current.getLayout(layoutName);
      })
      .then((data) => {
        if (data && data.version) {
          const nextLayout = ensureLayoutDefaults(data);
          setLayout(nextLayout);
          setSnapshot(createEmptySnapshot(nextLayout));
          setButtonMappings(data.buttonMappings || GamepadManager.createDefaultButtonMappings());
          setStickMappings(data.stickMappings || GamepadManager.createDefaultStickMappings());
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const manager = new GamepadManager();
    manager.onConnect(() => setConnected(true));
    manager.onDisconnect(() => {
      setConnected(false);
      setSnapshot(createEmptySnapshot(layoutRef.current));
    });

    const pollTimer = window.setInterval(() => manager.pollConnection(), 100);
    let frame = 0;
    const updateLoop = () => {
      const gamepad = manager.getGamepad();
      if (gamepad) {
        const nextSnapshot = readGamepadSnapshot(
          manager,
          gamepad,
          layoutRef.current,
          buttonMappingsRef.current,
          stickMappingsRef.current
        );
        setSnapshot(nextSnapshot);
        if (layoutRef.current.inputhistorymode.toggle && nextSnapshot.statusChanged) {
          setInputHistory((current) => [nextSnapshot.inputs, ...current].slice(0, layoutRef.current.inputhistorymode.count));
        }
      }
      frame = window.requestAnimationFrame(updateLoop);
    };
    frame = window.requestAnimationFrame(updateLoop);

    return () => {
      window.clearInterval(pollTimer);
      window.cancelAnimationFrame(frame);
    };
  }, [buttonMappingsRef, layoutRef, stickMappingsRef]);

  return (
    <div id="container" className="container">
      <GamepadView
        layout={layout}
        stickClass={snapshot.stickClass}
        pressedButtons={snapshot.pressedButtons}
        connected={connected}
        inputHistory={inputHistory}
      />
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<ViewerApp />);
}
