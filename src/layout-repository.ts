import * as fs from "fs";
import * as path from "path";
import { selectDefaultLayoutEntry } from "./default-layout";
import { resolveAvailableAssetName, validateImageUpload } from "./image-asset";
import { collectLayoutAssets } from "./layout-assets";
import {
  deserializeLayoutDocument,
  serializeLayoutDocument,
} from "./layout-document";
import {
  assertValidLayoutName,
  isLayoutNameTaken,
  resolveAvailableLayoutName,
} from "./layout-name";
import { imageMimeType, readLayoutPackage } from "./layout-package";
import type { Layout, LayoutEntry } from "./types";

export interface LayoutRepositoryOptions {
  builtinLayoutDir: string;
  userLayoutDir: string;
  defaultLayoutFile: string;
}

export class CorruptLayoutError extends Error {
  readonly cause: unknown;
  constructor(
    readonly filePath: string,
    cause?: unknown,
  ) {
    super(`Corrupted layout JSON: ${filePath}`);
    this.name = "CorruptLayoutError";
    this.cause = cause;
  }
}

function readJson(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new CorruptLayoutError(filePath, error);
  }
}

function getLayoutDirs(baseDir: string): string[] {
  if (!fs.existsSync(baseDir)) return [];
  return fs
    .readdirSync(baseDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function removeUnreferencedAssets(layoutDir: string, layout: Layout): void {
  const referenced = new Set(collectLayoutAssets(layout));
  for (const entry of fs.readdirSync(layoutDir, { withFileTypes: true })) {
    if (
      entry.isFile() &&
      /\.(?:png|jpe?g|webp|gif)$/i.test(entry.name) &&
      !referenced.has(entry.name)
    ) {
      fs.unlinkSync(path.join(layoutDir, entry.name));
    }
  }
}

export function writeJsonAtomically(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  try {
    fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2));
    fs.renameSync(temporaryPath, filePath);
  } finally {
    if (fs.existsSync(temporaryPath)) fs.unlinkSync(temporaryPath);
  }
}

export { collectLayoutAssets } from "./layout-assets";

export function findAssetSources(
  sourceDirs: string[],
  assetNames: Set<string>,
): Map<string, string> {
  const remaining = new Set(assetNames);
  const sources = new Map<string, string>();
  for (const sourceDir of sourceDirs) {
    if (remaining.size === 0) break;
    for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
      if (!entry.isFile() || !remaining.has(entry.name)) continue;
      sources.set(entry.name, path.join(sourceDir, entry.name));
      remaining.delete(entry.name);
    }
  }
  return sources;
}

export class LayoutRepository {
  constructor(private readonly options: LayoutRepositoryOptions) {}

  private findLayoutPath(name: string): string | null {
    assertValidLayoutName(name);
    const userPath = path.join(this.options.userLayoutDir, name);
    if (fs.existsSync(userPath)) return userPath;
    const builtinPath = path.join(this.options.builtinLayoutDir, name);
    return fs.existsSync(builtinPath) ? builtinPath : null;
  }

  has(name: string): boolean {
    assertValidLayoutName(name);
    return isLayoutNameTaken(name, this.list());
  }

  private copyAssets(
    layout: unknown,
    sourceLayoutName: string,
    targetLayoutName: string,
  ): void {
    const targetDir = path.join(this.options.userLayoutDir, targetLayoutName);
    const sourceDirs: string[] = [];
    const sourceLayoutPath = this.findLayoutPath(sourceLayoutName);
    if (sourceLayoutPath) sourceDirs.push(sourceLayoutPath);
    sourceDirs.push(
      ...getLayoutDirs(this.options.userLayoutDir).map((name) =>
        path.join(this.options.userLayoutDir, name),
      ),
      ...getLayoutDirs(this.options.builtinLayoutDir).map((name) =>
        path.join(this.options.builtinLayoutDir, name),
      ),
    );

    const missingAssets = new Set(
      collectLayoutAssets(layout).filter(
        (asset) => !fs.existsSync(path.join(targetDir, asset)),
      ),
    );
    const assetSources = findAssetSources(
      [...new Set(sourceDirs)],
      missingAssets,
    );
    for (const [asset, sourcePath] of assetSources) {
      const targetPath = path.join(targetDir, asset);
      fs.copyFileSync(sourcePath, targetPath);
    }
  }

  list(): LayoutEntry[] {
    return [
      ...getLayoutDirs(this.options.builtinLayoutDir).map((name) => ({
        id: name,
        name,
        builtin: true,
      })),
      ...getLayoutDirs(this.options.userLayoutDir).map((name) => ({
        id: name,
        name,
        builtin: false,
      })),
    ];
  }

  read(name: string, builtin = false): Layout {
    assertValidLayoutName(name);
    const layoutPath = builtin
      ? path.join(this.options.builtinLayoutDir, name)
      : this.findLayoutPath(name);
    if (!layoutPath) return deserializeLayoutDocument({});
    const jsonPath = path.join(layoutPath, "layout.json");
    try {
      const layout = deserializeLayoutDocument(
        fs.existsSync(jsonPath) ? readJson(jsonPath) : {},
      );
      // Layouts written before v3 have no id; their directory name is it.
      return layout.id ? layout : { ...layout, id: path.basename(layoutPath) };
    } catch (error) {
      if (error instanceof CorruptLayoutError) throw error;
      throw new CorruptLayoutError(jsonPath, error);
    }
  }

  save(name: string, layout: Layout): void {
    assertValidLayoutName(name);
    const layoutDir = path.join(this.options.userLayoutDir, name);
    ensureDir(layoutDir);
    this.copyAssets(layout, layout.name || name, name);
    // The directory is the identity, so a copy never carries the source id.
    writeJsonAtomically(
      path.join(layoutDir, "layout.json"),
      serializeLayoutDocument({ ...layout, name, id: name }),
    );
    removeUnreferencedAssets(layoutDir, layout);
  }

  async importPackage(
    data: Uint8Array | ArrayBuffer,
  ): Promise<{ name: string; layout: Layout }> {
    const contents = await readLayoutPackage(data);
    const requestedName = contents.layout.name || "imported";
    assertValidLayoutName(requestedName);
    const name = resolveAvailableLayoutName(requestedName, this.list());

    for (const [fileName, bytes] of contents.assets) {
      validateImageUpload({
        data: `data:${imageMimeType(fileName)};base64,${Buffer.from(bytes).toString("base64")}`,
        fileName,
      });
    }

    ensureDir(this.options.userLayoutDir);
    const targetDir = path.join(this.options.userLayoutDir, name);
    const stagingDir = path.join(
      this.options.userLayoutDir,
      `.${name}.import-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    // An imported copy is a new layout, so it never reuses the packaged id.
    const layout = { ...contents.layout, name, id: name };
    try {
      ensureDir(stagingDir);
      for (const [fileName, bytes] of contents.assets) {
        fs.writeFileSync(path.join(stagingDir, fileName), bytes);
      }
      writeJsonAtomically(
        path.join(stagingDir, "layout.json"),
        serializeLayoutDocument(layout),
      );
      fs.renameSync(stagingDir, targetDir);
      return { name, layout };
    } finally {
      if (fs.existsSync(stagingDir))
        fs.rmSync(stagingDir, { recursive: true, force: true });
    }
  }

  delete(name: string): boolean {
    assertValidLayoutName(name);
    const layoutDir = path.join(this.options.userLayoutDir, name);
    if (!fs.existsSync(layoutDir)) return false;
    fs.rmSync(layoutDir, { recursive: true });
    return true;
  }

  rename(oldName: string, newName: string): boolean {
    assertValidLayoutName(oldName);
    assertValidLayoutName(newName);
    const oldDir = path.join(this.options.userLayoutDir, oldName);
    if (!fs.existsSync(oldDir)) return false;
    const newDir = path.join(this.options.userLayoutDir, newName);
    fs.renameSync(oldDir, newDir);

    const jsonPath = path.join(newDir, "layout.json");
    if (fs.existsSync(jsonPath)) {
      const layout = deserializeLayoutDocument(readJson(jsonPath));
      writeJsonAtomically(
        jsonPath,
        serializeLayoutDocument({ ...layout, name: newName, id: newName }),
      );
    }

    if (this.getDefault().name === oldName) this.setDefault(newName);
    return true;
  }

  uploadImage(data: string, layoutName: string, fileName: string): string {
    assertValidLayoutName(layoutName);
    validateImageUpload({ data, fileName });
    const layoutDir = path.join(this.options.userLayoutDir, layoutName);
    ensureDir(layoutDir);
    const safeFileName = resolveAvailableAssetName(
      path.basename(fileName),
      new Set(fs.readdirSync(layoutDir)),
    );
    const base64Data = data.replace(/^data:image\/[^;]+;base64,/, "");
    fs.writeFileSync(
      path.join(layoutDir, safeFileName),
      Buffer.from(base64Data, "base64"),
    );
    return safeFileName;
  }

  getDefault(): { name: string } {
    if (!fs.existsSync(this.options.defaultLayoutFile))
      return { name: "default" };
    try {
      return readJson(this.options.defaultLayoutFile) as { name: string };
    } catch (error) {
      if (error instanceof CorruptLayoutError) return { name: "default" };
      throw error;
    }
  }

  readDefault(): Layout {
    const entry = selectDefaultLayoutEntry(
      this.list(),
      this.getDefault().name || "default",
    );
    return entry ? this.read(entry.name, entry.builtin) : this.read("default");
  }

  setDefault(name: string): void {
    assertValidLayoutName(name);
    writeJsonAtomically(this.options.defaultLayoutFile, { name });
  }
}
