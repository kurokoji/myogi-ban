import * as path from "path";

export function resolveElectronDataDir(
  development: boolean,
  appRoot: string,
  userDataDir: string,
): string {
  return development ? path.join(appRoot, ".dev-data") : userDataDir;
}
