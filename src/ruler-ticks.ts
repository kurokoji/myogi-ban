export function createSignedRulerTicks(length: number, step = 10): number[] {
  const lastTick = Math.floor(length / step) * step;
  const positiveTicks = Array.from(
    { length: lastTick / step + 1 },
    (_, index) => index * step,
  );
  const negativeTicks = Array.from(
    { length: lastTick / step },
    (_, index) => -(index + 1) * step,
  );
  return [...negativeTicks.reverse(), ...positiveTicks];
}
