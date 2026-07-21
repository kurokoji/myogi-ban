import type JSZipType from "jszip";
import { cloneLayout } from "./editor-helpers";
import { ensureLayoutDefaults } from "./layout";
import { collectLayoutAssets } from "./layout-assets";
import { serializeLayoutDocument } from "./layout-document";
import { parseImportedLayoutJson } from "./layout-validation";
import type { Layout } from "./types";

export class InvalidLayoutPackageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidLayoutPackageError";
  }
}

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

export function replaceLayoutAssetName(
  layout: Layout,
  currentName: string,
  nextName: string,
): Layout {
  const updated = cloneLayout(layout);
  if (updated.background.image === currentName)
    updated.background.image = nextName;
  for (const button of [updated.defaultbuttons, ...updated.buttons]) {
    if (button.img === currentName) button.img = nextName;
    if (button.imgp === currentName) button.imgp = nextName;
  }
  return updated;
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
    if (!data) throw new InvalidLayoutPackageError(`Missing asset: ${name}`);
    archive.file(`assets/${name}`, data);
  }
  return archive.generateAsync({ type: "uint8array", compression: "DEFLATE" });
}

export async function readLayoutPackage(
  data: Uint8Array | ArrayBuffer,
): Promise<LayoutPackageContents> {
  const { default: JSZip } = await import("jszip");
  let archive: JSZipType;
  try {
    archive = await JSZip.loadAsync(data);
  } catch (error) {
    throw new InvalidLayoutPackageError(String(error));
  }
  const layoutEntry = archive.file("layout.json");
  if (!layoutEntry) throw new InvalidLayoutPackageError("Missing layout.json");

  let layout: Layout;
  try {
    layout = ensureLayoutDefaults(
      parseImportedLayoutJson(await layoutEntry.async("string")),
    );
  } catch (error) {
    throw new InvalidLayoutPackageError(String(error));
  }

  const assets = new Map<string, Uint8Array>();
  for (const name of packageAssetNames(layout)) {
    const entry = archive.file(`assets/${name}`);
    if (!entry) throw new InvalidLayoutPackageError(`Missing asset: ${name}`);
    assets.set(name, await entry.async("uint8array"));
  }
  return { layout, assets };
}
