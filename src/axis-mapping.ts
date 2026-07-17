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
