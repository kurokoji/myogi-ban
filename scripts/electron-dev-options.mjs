import { join } from "node:path";

export function createElectronDevSpawnOptions(options) {
  const env = { ...options.env };
  if (options.platform === "linux") {
    const bundledLibraries = join(
      options.cwd,
      ".libs/usr/lib/x86_64-linux-gnu",
    );
    env.LD_LIBRARY_PATH = [bundledLibraries, env.LD_LIBRARY_PATH]
      .filter(Boolean)
      .join(":");
  }

  return {
    command: options.electronPath,
    args: [".", "--dev"],
    env,
  };
}
