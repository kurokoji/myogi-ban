export function createRestartableProcess(spawnChild) {
  let child = null;
  const start = () => {
    child = spawnChild();
    return child;
  };
  const stop = async () => {
    if (!child) return;
    const current = child;
    child = null;
    await new Promise((resolve) => {
      current.once("exit", resolve);
      current.kill("SIGTERM");
    });
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
