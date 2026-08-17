import * as fs from "fs";
import * as path from "path";
import { selectDefaultLayoutEntry } from "./default-layout";
import { resolveAvailableAssetName, validateImageUpload } from "./image-asset";
import { collectLayoutAssets } from "./layout-assets";
import {
  deserializeLayoutDocument,
  serializeLayoutDocument,
} from "./layout-document";
import { createLayoutId } from "./layout-id";
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

  /**
   * A layout that cannot be read still belongs in the list, so its id stands
   * in for the name it could not report.
   */
  private storedName(baseDir: string, id: string): string {
    const jsonPath = path.join(baseDir, id, "layout.json");
    if (!fs.existsSync(jsonPath)) return id;
    try {
      const document = JSON.parse(fs.readFileSync(jsonPath, "utf8")) as {
        name?: unknown;
      };
      return typeof document.name === "string" && document.name
        ? document.name
        : id;
    } catch {
      return id;
    }
  }

  list(): LayoutEntry[] {
    return [
      ...getLayoutDirs(this.options.builtinLayoutDir).map((id) => ({
        id,
        name: this.storedName(this.options.builtinLayoutDir, id),
        builtin: true,
      })),
      ...getLayoutDirs(this.options.userLayoutDir).map((id) => ({
        id,
        name: this.storedName(this.options.userLayoutDir, id),
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

  save(id: string, layout: Layout): void {
    assertValidLayoutName(id);
    const layoutDir = path.join(this.options.userLayoutDir, id);
    ensureDir(layoutDir);
    this.copyAssets(layout, layout.id || layout.name || id, id);
    // The directory is the identity, so a copy never carries the source id.
    writeJsonAtomically(
      path.join(layoutDir, "layout.json"),
      serializeLayoutDocument({ ...layout, name: layout.name || id, id }),
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
    // An imported copy is a new layout, so it is given its own id.
    const id = createLayoutId();
    const targetDir = path.join(this.options.userLayoutDir, id);
    const stagingDir = path.join(
      this.options.userLayoutDir,
      `.${id}.import-${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    );
    const layout = { ...contents.layout, name, id };
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

  /**
   * Renaming edits the stored name only. The directory, the id, the assets,
   * and anything pointing at the layout stay where they are.
   */
  rename(id: string, newName: string): boolean {
    assertValidLayoutName(id);
    assertValidLayoutName(newName);
    const layoutDir = path.join(this.options.userLayoutDir, id);
    const jsonPath = path.join(layoutDir, "layout.json");
    if (!fs.existsSync(jsonPath)) return false;

    const layout = deserializeLayoutDocument(readJson(jsonPath));
    writeJsonAtomically(
      jsonPath,
      serializeLayoutDocument({ ...layout, name: newName, id }),
    );
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

  /** Pointer files written before v3 stored the id under `name`. */
  getDefault(): { id: string } {
    if (!fs.existsSync(this.options.defaultLayoutFile))
      return { id: "default" };
    try {
      const stored = readJson(this.options.defaultLayoutFile) as {
        id?: string;
        name?: string;
      };
      return { id: stored.id || stored.name || "default" };
    } catch (error) {
      if (error instanceof CorruptLayoutError) return { id: "default" };
      throw error;
    }
  }

  readDefault(): Layout {
    const entry = selectDefaultLayoutEntry(
      this.list(),
      this.getDefault().id || "default",
    );
    return entry ? this.read(entry.id, entry.builtin) : this.read("default");
  }

  setDefault(id: string): void {
    assertValidLayoutName(id);
    writeJsonAtomically(this.options.defaultLayoutFile, { id });
  }
}
