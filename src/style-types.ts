import type { CSSProperties } from "react";

export type CSSVariableProperties = {
  [name in `--${string}`]?: string | number;
};
export type CSSVariableStyle = CSSProperties & CSSVariableProperties;

export function cssVariables<T extends CSSVariableStyle>(style: T): T {
  return style;
}
