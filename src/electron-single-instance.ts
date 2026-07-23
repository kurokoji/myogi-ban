import { resolveElectronLaunchOptions } from "./electron-launch-options";

export function shouldOpenWindowForSecondInstance(
  args: readonly string[],
): boolean {
  return !resolveElectronLaunchOptions(args).serverOnly;
}
