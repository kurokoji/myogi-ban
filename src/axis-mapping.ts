export type AxisMappingCode = number & {
  readonly __axisMapping: unique symbol;
};
export interface AxisMapping {
  axis: number;
  value: number;
}

const POSITIVE_BASE = 1_000_000;
const NEGATIVE_BASE = 2_000_000;
const AXIS_FACTOR = 10_000;

export function encodeAxisMapping(mapping: AxisMapping): AxisMappingCode {
  const base = mapping.value < 0 ? NEGATIVE_BASE : POSITIVE_BASE;
  return (base +
    mapping.axis * AXIS_FACTOR +
    Math.abs(Math.floor(mapping.value * 100))) as AxisMappingCode;
}

export function decodeAxisMapping(code: number): AxisMapping | null {
  if (!Number.isInteger(code) || code < POSITIVE_BASE) return null;
  const negative = code >= NEGATIVE_BASE;
  const payload = code - (negative ? NEGATIVE_BASE : POSITIVE_BASE);
  const axis = Math.floor(payload / AXIS_FACTOR);
  const magnitude = (payload - axis * AXIS_FACTOR) / 100;
  return { axis, value: negative ? -magnitude : magnitude };
}

/** Whether `axes` has moved far enough from `center` toward the mapped direction. */
export function isAxisMappingTriggered(
  code: number,
  axes: readonly number[],
  center: readonly number[],
): boolean {
  const mapping = decodeAxisMapping(code);
  if (!mapping) return false;
  const { axis, value } = mapping;
  if (axis >= axes.length) return false;

  const sign = value < 0 ? -1 : 1;
  const min = (value - (center[axis] || 0)) * 0.55;
  const max = value + 0.05 * sign;
  return axes[axis] >= Math.min(min, max) && axes[axis] <= Math.max(min, max);
}
