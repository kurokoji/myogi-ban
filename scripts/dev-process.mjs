export function createRestartableProcess(spawnChild, options = {}) {
  let child = null;
  let stopping = false;
  const start = () => {
    const started = spawnChild();
    child = started;
    started.once("exit", (code, signal) => {
      if (child === started) child = null;
      if (!stopping) options.onUnexpectedExit?.(code ?? null, signal ?? null);
    });
    return child;
  };
  const stop = async () => {
    if (!child) return;
    const current = child;
    stopping = true;
    await new Promise((resolve) => {
      current.once("exit", resolve);
      current.kill("SIGTERM");
    });
    stopping = false;
  };
  return {
    start,
    async restart() {
      await stop();
      return start();
    },
    stop,
    current: () => child,
  };
}
