import type { Layout } from "../types";
import {
  deserializeLayoutDocumentV2,
  isLayoutDocumentV2,
  type LayoutDocumentV2,
  serializeLayoutDocumentV2,
} from "./v2";

export const CURRENT_LAYOUT_FORMAT_VERSION = 3;

/**
 * v3 adds the layout id. The id, not the name, identifies a layout for its
 * directory, assets, and API routes, so renaming never moves a layout.
 */
export interface LayoutDocumentV3
  extends Omit<LayoutDocumentV2, "formatVersion"> {
  formatVersion: 3;
  id: string;
}

function asVersion2(document: LayoutDocumentV3): LayoutDocumentV2 {
  return { ...document, formatVersion: 2 };
}

export function isLayoutDocumentV3(value: unknown): value is LayoutDocumentV3 {
  if (typeof value !== "object" || value === null) return false;
  const document = value as Record<string, unknown>;
  if (document.formatVersion !== 3) return false;
  if (document.id !== undefined && typeof document.id !== "string")
    return false;
  return isLayoutDocumentV2({ ...document, formatVersion: 2 });
}

export function serializeLayoutDocument(layout: Layout): LayoutDocumentV3 {
  const { formatVersion, ...rest } = serializeLayoutDocumentV2(layout);
  void formatVersion;
  return {
    formatVersion: CURRENT_LAYOUT_FORMAT_VERSION,
    id: layout.id ?? "",
    ...rest,
  };
}

export function deserializeLayoutDocumentV3(
  document: LayoutDocumentV3,
): Layout {
  if (!isLayoutDocumentV3(document)) throw new Error("Invalid v3 layout");
  return {
    ...deserializeLayoutDocumentV2(asVersion2(document)),
    sourceFormatVersion: 3,
    id: document.id ?? "",
  };
}
