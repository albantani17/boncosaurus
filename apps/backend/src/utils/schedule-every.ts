/** Runs a task now and then every interval, never overlapping itself; returns a function that stops it. */
export function scheduleEvery(intervalMs: number, task: () => Promise<unknown>, onError: (error: unknown) => void): () => void {
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await task();
    } catch (error) {
      onError(error);
    } finally {
      running = false;
    }
  };

  void run();
  const timer = setInterval(run, intervalMs);
  return () => clearInterval(timer);
}
