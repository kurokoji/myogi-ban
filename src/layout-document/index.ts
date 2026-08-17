export { deserializeLayoutDocumentV1, type LayoutDocumentV1 } from "./v1";
export {
  deserializeLayoutDocumentV2,
  isLayoutDocumentV2,
  type LayoutDocumentV2,
} from "./v2";
export {
  CURRENT_LAYOUT_FORMAT_VERSION,
  deserializeLayoutDocumentV3,
  isLayoutDocumentV3,
  type LayoutDocumentV3,
  serializeLayoutDocument,
} from "./v3";

import type { Layout } from "../types";
import { deserializeLayoutDocumentV1 } from "./v1";
import {
  deserializeLayoutDocumentV2,
  isLayoutDocumentV2,
  type LayoutDocumentV2,
} from "./v2";
import {
  deserializeLayoutDocumentV3,
  isLayoutDocumentV3,
  type LayoutDocumentV3,
} from "./v3";

export function deserializeLayoutDocument(document: unknown): Layout {
  if (
    typeof document === "object" &&
    document !== null &&
    "formatVersion" in document
  ) {
    if (document.formatVersion === 3) {
      if (!isLayoutDocumentV3(document)) throw new Error("Invalid v3 layout");
      return deserializeLayoutDocumentV3(document as LayoutDocumentV3);
    }
    if (document.formatVersion !== 2)
      throw new Error("Unsupported layout format");
    if (!isLayoutDocumentV2(document)) throw new Error("Invalid v2 layout");
    return {
      ...deserializeLayoutDocumentV2(document as LayoutDocumentV2),
      id: "",
    };
  }
  return { ...deserializeLayoutDocumentV1(document as never), id: "" };
}
