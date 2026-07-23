export interface ElectronLaunchOptions {
  development: boolean;
  serverOnly: boolean;
}

export function resolveElectronLaunchOptions(
  args: readonly string[],
): ElectronLaunchOptions {
  return {
    development: args.includes("--dev"),
    serverOnly: args.includes("--server-only"),
  };
}
