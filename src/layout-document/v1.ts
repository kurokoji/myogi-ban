import { ensureLayoutDefaults } from "../layout";
import type { Layout } from "../types";

export type LayoutDocumentV1 = Partial<Layout>;

export function deserializeLayoutDocumentV1(
  document: LayoutDocumentV1,
): Layout {
  return ensureLayoutDefaults(document);
}
