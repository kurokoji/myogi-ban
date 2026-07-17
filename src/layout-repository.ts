import * as fs from "fs";
import * as path from "path";
import { assertValidLayoutName, isLayoutNameTaken } from "./layout-name";
import type { Layout, LayoutEntry } from "./types";

export interface LayoutRepositoryOptions {
  builtinLayoutDir: string;
  userLayoutDir: string;
  defaultLayoutFile: string;
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

function writeJson(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function collectLayoutAssets(layout: unknown): string[] {
  const data = layout as Partial<Layout> | null;
  const assets = new Set<string>();
  const add = (fileName: unknown) => {
    if (typeof fileName === "string" && fileName.trim()) {
      assets.add(path.basename(fileName));
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

    for (const asset of collectLayoutAssets(layout)) {
      const targetPath = path.join(targetDir, asset);
      if (fs.existsSync(targetPath)) continue;
      for (const sourceDir of sourceDirs) {
        const sourcePath = path.join(sourceDir, asset);
        if (fs.existsSync(sourcePath)) {
          fs.copyFileSync(sourcePath, targetPath);
          break;
        }
      }
    }
  }

  list(): LayoutEntry[] {
    return [
      ...getLayoutDirs(this.options.builtinLayoutDir).map((name) => ({
        name,
        builtin: true,
      })),
      ...getLayoutDirs(this.options.userLayoutDir).map((name) => ({
        name,
        builtin: false,
      })),
    ];
  }

  read(name: string, builtin = false): unknown {
    assertValidLayoutName(name);
    const layoutPath = builtin
      ? path.join(this.options.builtinLayoutDir, name)
      : this.findLayoutPath(name);
    if (!layoutPath) return {};
    const jsonPath = path.join(layoutPath, "layout.json");
    return fs.existsSync(jsonPath)
      ? JSON.parse(fs.readFileSync(jsonPath, "utf8"))
      : {};
  }

  save(name: string, layout: Layout): void {
    assertValidLayoutName(name);
    const layoutDir = path.join(this.options.userLayoutDir, name);
    ensureDir(layoutDir);
    this.copyAssets(layout, layout.name || name, name);
    writeJson(path.join(layoutDir, "layout.json"), { ...layout, name });
  }

  delete(name: string): boolean {
    assertValidLayoutName(name);
    const layoutDir = path.join(this.options.userLayoutDir, name);
    if (!fs.existsSync(layoutDir)) return false;
    fs.rmSync(layoutDir, { recursive: true });
    return true;
  }

  uploadImage(data: string, layoutName: string, fileName: string): string {
    assertValidLayoutName(layoutName);
    const safeFileName = path.basename(fileName);
    const layoutDir = path.join(this.options.userLayoutDir, layoutName);
    ensureDir(layoutDir);
    const base64Data = data.replace(/^data:image\/[^;]+;base64,/, "");
    fs.writeFileSync(
      path.join(layoutDir, safeFileName),
      Buffer.from(base64Data, "base64"),
    );
    return safeFileName;
  }

  getDefault(): { name: string } {
    return fs.existsSync(this.options.defaultLayoutFile)
      ? JSON.parse(fs.readFileSync(this.options.defaultLayoutFile, "utf8"))
      : { name: "default" };
  }

  setDefault(name: string): void {
    assertValidLayoutName(name);
    writeJson(this.options.defaultLayoutFile, { name });
  }
}
