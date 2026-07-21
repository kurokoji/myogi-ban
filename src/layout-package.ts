import type JSZipType from "jszip";
import { ImageUploadValidationError, validateImageBytes } from "./image-asset";
import { ensureLayoutDefaults } from "./layout";
import { collectLayoutAssets } from "./layout-assets";
import { serializeLayoutDocument } from "./layout-document";
import { parseImportedLayoutJson } from "./layout-validation";
import type { Layout } from "./types";

export type LayoutPackageErrorCode =
  | "invalid_zip"
  | "package_too_large"
  | "too_many_files"
  | "unsafe_path"
  | "unexpected_file"
  | "missing_layout"
  | "layout_too_large"
  | "invalid_layout"
  | "missing_asset"
  | "image_too_large"
  | "invalid_image_content";

export class InvalidLayoutPackageError extends Error {
  constructor(readonly code: LayoutPackageErrorCode) {
    super(`Invalid layout package: ${code}`);
    this.name = "InvalidLayoutPackageError";
  }
}

export const MAX_LAYOUT_PACKAGE_BYTES = 64 * 1024 * 1024;
export const MAX_LAYOUT_PACKAGE_FILES = 128;
export const MAX_LAYOUT_DOCUMENT_BYTES = 1024 * 1024;

export interface LayoutPackageContents {
  layout: Layout;
  assets: Map<string, Uint8Array>;
}

export function imageMimeType(fileName: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "webp") return "image/webp";
  if (extension === "gif") return "image/gif";
  return "image/png";
}

function packageAssetNames(layout: Layout): string[] {
  return collectLayoutAssets({
    ...layout,
    buttons: layout.buttons.slice(0, layout.totalbuttonshow),
  });
}

export async function createLayoutPackage(
  layout: Layout,
  loadAsset: (name: string) => Promise<Uint8Array | undefined>,
): Promise<Uint8Array> {
  const { default: JSZip } = await import("jszip");
  const archive = new JSZip();
  archive.file(
    "layout.json",
    JSON.stringify(serializeLayoutDocument(layout), null, 2),
  );
  for (const name of packageAssetNames(layout)) {
    const data = await loadAsset(name);
    if (!data) throw new InvalidLayoutPackageError("missing_asset");
    archive.file(`assets/${name}`, data);
  }
  return archive.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export async function readLayoutPackage(
  data: Uint8Array | ArrayBuffer,
): Promise<LayoutPackageContents> {
  if (data.byteLength > MAX_LAYOUT_PACKAGE_BYTES)
    throw new InvalidLayoutPackageError("package_too_large");
  const { default: JSZip } = await import("jszip");
  let archive: JSZipType;
  try {
    archive = await JSZip.loadAsync(data);
  } catch {
    throw new InvalidLayoutPackageError("invalid_zip");
  }
  const entries = Object.values(archive.files).filter((entry) => !entry.dir);
  if (entries.length > MAX_LAYOUT_PACKAGE_FILES)
    throw new InvalidLayoutPackageError("too_many_files");
  if (entries.some((entry) => entry.unsafeOriginalName !== entry.name))
    throw new InvalidLayoutPackageError("unsafe_path");
  const layoutEntry = archive.file("layout.json");
  if (!layoutEntry) throw new InvalidLayoutPackageError("missing_layout");

  let layout: Layout;
  try {
    const layoutText = await layoutEntry.async("string");
    if (
      new TextEncoder().encode(layoutText).byteLength >
      MAX_LAYOUT_DOCUMENT_BYTES
    )
      throw new InvalidLayoutPackageError("layout_too_large");
    layout = ensureLayoutDefaults(parseImportedLayoutJson(layoutText));
  } catch (error) {
    if (error instanceof InvalidLayoutPackageError) throw error;
    throw new InvalidLayoutPackageError("invalid_layout");
  }

  const assetNames = packageAssetNames(layout);
  const allowedPaths = new Set([
    "layout.json",
    ...assetNames.map((name) => `assets/${name}`),
  ]);
  if (entries.some((entry) => !allowedPaths.has(entry.name)))
    throw new InvalidLayoutPackageError("unexpected_file");
  const assets = new Map<string, Uint8Array>();
  let totalBytes = 0;
  for (const name of assetNames) {
    const entry = archive.file(`assets/${name}`);
    if (!entry) throw new InvalidLayoutPackageError("missing_asset");
    const bytes = await entry.async("uint8array");
    totalBytes += bytes.byteLength;
    if (totalBytes > MAX_LAYOUT_PACKAGE_BYTES)
      throw new InvalidLayoutPackageError("package_too_large");
    try {
      validateImageBytes({ bytes, fileName: name });
    } catch (error) {
      if (
        error instanceof ImageUploadValidationError &&
        error.code === "image_too_large"
      )
        throw new InvalidLayoutPackageError("image_too_large");
      throw new InvalidLayoutPackageError("invalid_image_content");
    }
    assets.set(name, bytes);
  }
  return { layout, assets };
}
