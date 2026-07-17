import * as fs from "fs";

interface ClosableServer {
  close: () => void;
}
interface CleanupFileSystem {
  exists: (filePath: string) => boolean;
  remove: (filePath: string) => void;
}

const nodeFileSystem: CleanupFileSystem = {
  exists: fs.existsSync,
  remove: fs.unlinkSync,
};

export function cleanupLocalServer(
  server: ClosableServer | null,
  pidFile: string,
  fileSystem: CleanupFileSystem = nodeFileSystem,
): void {
  server?.close();
  if (fileSystem.exists(pidFile)) fileSystem.remove(pidFile);
}
