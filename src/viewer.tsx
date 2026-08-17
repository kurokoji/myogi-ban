import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/m-plus-2/wght.css";
import "./i18n";
import { ApiClient } from "./api";
import { VIEWER_RECONNECT_DELAY_MS } from "./app-constants";
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
import type { GamepadState, Layout } from "./types";
import {
  createViewerWebSocketUrl,
  layoutForViewerState,
  nextViewerConnectionStatus,
  type ViewerConnectionStatus,
  viewerLayoutRequestFromSearch,
} from "./viewer-connection";

function ViewerApp(): React.ReactElement {
  const apiRef = useRef(new ApiClient());
  const layoutRequestRef = useRef(
    viewerLayoutRequestFromSearch(location.search),
  );
  const fixedLayoutRef = useRef(layoutRequestRef.current !== null);
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
  const [connectionStatus, setConnectionStatus] =
    useState<ViewerConnectionStatus>("loading");
  const layoutRef = useLatestRef(layout);
  const buttonMappingsRef = useLatestRef(buttonMappings);
  const stickMappingsRef = useLatestRef(stickMappings);

  useEffect(() => {
    Promise.all([
      apiRef.current.getDefaultLayout(),
      apiRef.current.getLayouts(),
    ])
      .then(([defaultLayout, entries]) => {
        const request = layoutRequestRef.current;
        const requestedEntry = request
          ? entries.find(
              (entry) =>
                // Sources saved before ids existed refer to layouts by name.
                (entry.id === request.id || entry.name === request.id) &&
                (!request.builtin || entry.builtin),
            )
          : undefined;
        fixedLayoutRef.current = Boolean(requestedEntry);
        const entry =
          requestedEntry ??
          selectDefaultLayoutEntry(entries, defaultLayout.id || "default");
        return entry
          ? apiRef.current.getLayout(
              entry.id,
              requestedEntry ? (request?.builtin ?? false) : entry.builtin,
            )
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
      .catch(() =>
        setConnectionStatus((current) =>
          nextViewerConnectionStatus(current, "api-error"),
        ),
      );
  }, []);

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | null = null;
    let retryTimer = 0;
    const connect = () => {
      socket = new WebSocket(createViewerWebSocketUrl(location));
      socket.onopen = () =>
        setConnectionStatus((current) =>
          nextViewerConnectionStatus(current, "socket-open"),
        );
      socket.onmessage = (event) => {
        const message = JSON.parse(String(event.data)) as {
          type?: string;
          data?: GamepadState;
        };
        if (message.type !== "state" || !message.data) return;
        const state = message.data;
        const nextLayout = ensureLayoutDefaults(
          layoutForViewerState(
            layoutRef.current,
            state.layout,
            fixedLayoutRef.current,
          ),
        );
        setLayout(nextLayout);
        setSnapshot({
          ...createEmptySnapshot(nextLayout),
          stickClass: state.stick,
          pressedButtons: state.buttons,
        });
      };
      socket.onclose = () => {
        setConnectionStatus((current) =>
          nextViewerConnectionStatus(current, "socket-close"),
        );
        if (!disposed)
          retryTimer = window.setTimeout(connect, VIEWER_RECONNECT_DELAY_MS);
      };
    };
    connect();
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, [layoutRef]);

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
    <div
      id="container"
      className="container"
      data-connection-status={connectionStatus}
    >
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
