import { execFile as execFileCallback } from "node:child_process";
import { join } from "node:path";
import { promisify } from "node:util";

// Written by obs-plugin/installer.nsi at install time (SetRegView 64), with
// DisplayVersion pinned to the app version the plugin was built alongside.
const REGISTRY_KEY =
  "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\MyogiBanObsPlugin";

export type ExecFile = (
  file: string,
  args: string[],
) => Promise<{ stdout: string }>;

const defaultExecFile: ExecFile = promisify(execFileCallback) as ExecFile;

function resolveRegExePath(): string {
  return join(process.env.SystemRoot ?? "C:\\Windows", "System32", "reg.exe");
}

export function parseDisplayVersion(stdout: string): string | null {
  const match = stdout.match(/DisplayVersion\s+REG_SZ\s+(\S+)/);
  return match ? match[1] : null;
}

export async function getInstalledObsPluginVersion(
  execFileImpl: ExecFile = defaultExecFile,
): Promise<string | null> {
  try {
    const { stdout } = await execFileImpl(resolveRegExePath(), [
      "query",
      REGISTRY_KEY,
      "/v",
      "DisplayVersion",
      "/reg:64",
    ]);
    return parseDisplayVersion(stdout);
  } catch {
    return null;
  }
}
