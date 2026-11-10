import {
  inputFrameFromNativeGamepad,
  type NativeGamepadState,
  type NativeInputSource,
} from "./native-input";

interface SdlControllerInstance extends NativeGamepadState {
  on(event: string, listener: (...args: never[]) => void): unknown;
  close(): void;
}

/** The slice of `@kmamal/sdl` that is used, so tests can fake it. */
export interface SdlModule {
  controller: {
    devices: readonly unknown[];
    openDevice(device: unknown): SdlControllerInstance;
    on(event: string, listener: (...args: never[]) => void): unknown;
    off(event: string, listener: (...args: never[]) => void): unknown;
  };
}

const CHANGE_EVENTS = ["buttonDown", "buttonUp", "axisMotion"] as const;

export function createSdlInputSource(sdl: SdlModule): NativeInputSource {
  return {
    subscribe(listener) {
      let active: SdlControllerInstance | null = null;
      let subscribed = true;

      const open = (device: unknown): void => {
        const controller = sdl.controller.openDevice(device);
        active = controller;
        const emit = (): void => {
          if (subscribed && active === controller) {
            listener(inputFrameFromNativeGamepad(controller));
          }
        };
        for (const event of CHANGE_EVENTS) controller.on(event, emit);
        controller.on("close", () => {
          if (active !== controller) return;
          active = null;
          if (subscribed) listener(null);
        });
      };
      const openIfIdle = (): void => {
        const device = sdl.controller.devices[0];
        if (subscribed && !active && device) open(device);
      };

      sdl.controller.on("deviceAdd", openIfIdle);
      openIfIdle();

      return () => {
        subscribed = false;
        sdl.controller.off("deviceAdd", openIfIdle);
        active?.close();
        active = null;
      };
    },
  };
}

/**
 * Loads SDL on first use. Requiring the native module initializes SDL, which
 * can interfere with the Gamepad API in the editor, so it must not happen at
 * startup. A missing or broken binary only disables native input.
 */
export function loadSdlInputSource(
  load: () => SdlModule,
  log: (message: string) => void = console.warn,
): NativeInputSource {
  let source: NativeInputSource | null | undefined;
  return {
    subscribe(listener) {
      if (source === undefined) {
        try {
          source = createSdlInputSource(load());
        } catch (error) {
          log(`Native controller input is unavailable: ${String(error)}`);
          source = null;
        }
      }
      return source ? source.subscribe(listener) : () => {};
    },
  };
}
