import type { Layout } from "./types";

function baseName(fileName: string): string {
  return fileName.split(/[\\/]/).pop() || "";
}

export function collectLayoutAssets(layout: unknown): string[] {
  const data = layout as Partial<Layout> | null;
  const assets = new Set<string>();
  const add = (fileName: unknown) => {
    if (typeof fileName === "string" && fileName.trim()) {
      assets.add(baseName(fileName));
    }
  };

  add(data?.background?.image);
  add(data?.defaultbuttons?.img);
  add(data?.defaultbuttons?.imgp);
  for (const button of data?.buttons || []) {
    add(button?.img);
    add(button?.imgp);
  }
  return [...assets];
}
