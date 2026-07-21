export { deserializeLayoutDocumentV1, type LayoutDocumentV1 } from "./v1";
export {
  CURRENT_LAYOUT_FORMAT_VERSION,
  deserializeLayoutDocumentV2,
  isLayoutDocumentV2,
  type LayoutDocumentV2,
  serializeLayoutDocument,
} from "./v2";

import type { Layout } from "../types";
import { deserializeLayoutDocumentV1 } from "./v1";
import {
  deserializeLayoutDocumentV2,
  isLayoutDocumentV2,
  type LayoutDocumentV2,
} from "./v2";

export function deserializeLayoutDocument(document: unknown): Layout {
  if (
    typeof document === "object" &&
    document !== null &&
    "formatVersion" in document
  ) {
    if (document.formatVersion !== 2)
      throw new Error("Unsupported layout format");
    if (!isLayoutDocumentV2(document)) throw new Error("Invalid v2 layout");
    return deserializeLayoutDocumentV2(document as LayoutDocumentV2);
  }
  return deserializeLayoutDocumentV1(document as never);
}
