import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDefaultLayout } from "../src/layout";
import {
  CURRENT_LAYOUT_FORMAT_VERSION,
  serializeLayoutDocument,
} from "../src/layout-document";
import { createLayoutPackage } from "../src/layout-package";
import {
  CorruptLayoutError,
  collectLayoutAssets,
  findAssetSources,
  LayoutRepository,
} from "../src/layout-repository";

const PNG_BYTES = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

test("collectLayoutAssets returns safe unique image names", () => {
  const assets = collectLayoutAssets({
    background: { image: "images/background.png" },
    defaultbuttons: {
      img: "released.png",
      imgp: "pressed.png",
    },
    buttons: [
      { img: "nested/released.png", imgp: "button-pressed.png" },
      { img: "", imgp: null },
    ],
  });

  assert.deepEqual(assets, [
    "background.png",
    "released.png",
    "pressed.png",
    "button-pressed.png",
  ]);
});

test("findAssetSources scans directories once and preserves precedence", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-assets-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const preferred = join(root, "preferred");
  const fallback = join(root, "fallback");
  mkdirSync(preferred);
  mkdirSync(fallback);
  writeFileSync(join(preferred, "shared.png"), "preferred");
  writeFileSync(join(fallback, "shared.png"), "fallback");
  writeFileSync(join(fallback, "fallback.png"), "fallback");

  assert.deepEqual(
    findAssetSources(
      [preferred, fallback],
      new Set(["shared.png", "fallback.png", "missing.png"]),
    ),
    new Map([
      ["shared.png", join(preferred, "shared.png")],
      ["fallback.png", join(fallback, "fallback.png")],
    ]),
  );
});

test("LayoutRepository deletes user layouts only", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const builtinLayoutDir = join(root, "builtin");
  const userLayoutDir = join(root, "user");
  mkdirSync(join(builtinLayoutDir, "preset"), { recursive: true });
  mkdirSync(join(userLayoutDir, "custom"), { recursive: true });
  const repository = new LayoutRepository({
    builtinLayoutDir,
    userLayoutDir,
    defaultLayoutFile: join(root, "default.json"),
  });

  assert.equal(repository.delete("custom"), true);
  assert.equal(existsSync(join(userLayoutDir, "custom")), false);
  assert.equal(repository.delete("preset"), false);
  assert.equal(existsSync(join(builtinLayoutDir, "preset")), true);
  assert.throws(() => repository.delete("../builtin"), /Invalid layout name/);
});

test("LayoutRepository renames a user layout, moving its directory and updating the stored name", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const userLayoutDir = join(root, "user");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir,
    defaultLayoutFile: join(root, "default.json"),
  });
  repository.save("custom", createDefaultLayout());

  assert.equal(repository.rename("custom", "renamed"), true);

  assert.equal(existsSync(join(userLayoutDir, "custom")), false);
  assert.equal(existsSync(join(userLayoutDir, "renamed")), true);
  const stored = JSON.parse(
    readFileSync(join(userLayoutDir, "renamed", "layout.json"), "utf8"),
  );
  assert.equal(stored.name, "renamed");
  assert.equal(repository.read("renamed").name, "renamed");
  assert.equal(repository.read("renamed").id, "renamed");
});

test("LayoutRepository rename repoints the default layout pointer when renaming the default layout", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: join(root, "user"),
    defaultLayoutFile: join(root, "default.json"),
  });
  repository.save("custom", createDefaultLayout());
  repository.setDefault("custom");

  repository.rename("custom", "renamed");

  assert.equal(repository.getDefault().id, "renamed");
});

test("LayoutRepository rename leaves the default layout pointer alone for a non-default layout", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: join(root, "user"),
    defaultLayoutFile: join(root, "default.json"),
  });
  repository.save("custom", createDefaultLayout());
  repository.save("other", createDefaultLayout());
  repository.setDefault("other");

  repository.rename("custom", "renamed");

  assert.equal(repository.getDefault().id, "other");
});

test("LayoutRepository rename returns false for built-in or missing layouts", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const builtinLayoutDir = join(root, "builtin");
  const userLayoutDir = join(root, "user");
  mkdirSync(join(builtinLayoutDir, "preset"), { recursive: true });
  const repository = new LayoutRepository({
    builtinLayoutDir,
    userLayoutDir,
    defaultLayoutFile: join(root, "default.json"),
  });

  assert.equal(repository.rename("preset", "renamed-preset"), false);
  assert.equal(existsSync(join(builtinLayoutDir, "preset")), true);
  assert.equal(repository.rename("missing", "renamed-missing"), false);
});

test("LayoutRepository rename rejects invalid layout names", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: join(root, "user"),
    defaultLayoutFile: join(root, "default.json"),
  });
  repository.save("custom", createDefaultLayout());

  assert.throws(
    () => repository.rename("custom", "../escaped"),
    /Invalid layout name/,
  );
  assert.throws(
    () => repository.rename("../escaped", "custom"),
    /Invalid layout name/,
  );
});

test("LayoutRepository detects existing user and built-in names", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const builtinLayoutDir = join(root, "builtin");
  const userLayoutDir = join(root, "user");
  mkdirSync(join(builtinLayoutDir, "Preset"), { recursive: true });
  mkdirSync(join(userLayoutDir, "Custom"), { recursive: true });
  const repository = new LayoutRepository({
    builtinLayoutDir,
    userLayoutDir,
    defaultLayoutFile: join(root, "default.json"),
  });

  assert.equal(repository.has("preset"), true);
  assert.equal(repository.has(" CUSTOM "), true);
  assert.equal(repository.has("new-layout"), false);
});

test("LayoutRepository rejects invalid layout names at every entry point", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: join(root, "user"),
    defaultLayoutFile: join(root, "default.json"),
  });
  const invalidName = "../escape";

  assert.throws(() => repository.has(invalidName), /Invalid layout name/);
  assert.throws(() => repository.read(invalidName), /Invalid layout name/);
  assert.throws(
    () => repository.save(invalidName, createDefaultLayout()),
    /Invalid layout name/,
  );
  assert.throws(() => repository.delete(invalidName), /Invalid layout name/);
  assert.throws(
    () =>
      repository.uploadImage("data:image/png;base64,", invalidName, "a.png"),
    /Invalid layout name/,
  );
  assert.throws(
    () => repository.setDefault(invalidName),
    /Invalid layout name/,
  );
  assert.equal(existsSync(join(root, "escape")), false);
});

test("LayoutRepository reports corrupted JSON without replacing it", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  mkdirSync(join(user, "broken"), { recursive: true });
  writeFileSync(join(user, "broken", "layout.json"), "{");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  assert.throws(() => repository.read("broken"), CorruptLayoutError);
});

test("LayoutRepository lists the id of every layout", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const builtin = join(root, "builtin");
  const user = join(root, "user");
  mkdirSync(join(builtin, "preset"), { recursive: true });
  const repository = new LayoutRepository({
    builtinLayoutDir: builtin,
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  const layout = createDefaultLayout();
  layout.name = "custom";
  repository.save("custom", layout);

  assert.deepEqual(repository.list(), [
    { id: "preset", name: "preset", builtin: true },
    { id: "custom", name: "custom", builtin: false },
  ]);
});

test("LayoutRepository lists the stored name of each layout", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  const layout = createDefaultLayout();
  layout.name = "HIT BOX ULTRA";
  repository.save("hit-box-ultra", layout);

  assert.deepEqual(repository.list(), [
    { id: "hit-box-ultra", name: "HIT BOX ULTRA", builtin: false },
  ]);
});

test("LayoutRepository lists a layout with unreadable json under its id", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  mkdirSync(join(user, "broken"), { recursive: true });
  writeFileSync(join(user, "broken", "layout.json"), "{ not json");
  mkdirSync(join(user, "empty"), { recursive: true });
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });

  assert.deepEqual(repository.list(), [
    { id: "broken", name: "broken", builtin: false },
    { id: "empty", name: "empty", builtin: false },
  ]);
});

test("LayoutRepository gives a legacy layout its directory name as its id", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  const legacy = {
    ...serializeLayoutDocument(createDefaultLayout()),
    formatVersion: 2,
  };
  delete (legacy as { id?: string }).id;
  mkdirSync(join(user, "legacy-layout"), { recursive: true });
  writeFileSync(
    join(user, "legacy-layout", "layout.json"),
    JSON.stringify(legacy),
  );

  assert.equal(repository.read("legacy-layout").id, "legacy-layout");
});

test("LayoutRepository saves a copy under its own id, not the source id", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  repository.save("original", createDefaultLayout());
  const source = repository.read("original");

  repository.save("copy", source);

  assert.equal(repository.read("original").id, "original");
  assert.equal(repository.read("copy").id, "copy");
});

test("LayoutRepository stores v2 documents and returns runtime layouts", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;

  repository.save("custom", layout);

  const stored = JSON.parse(
    readFileSync(join(user, "custom", "layout.json"), "utf8"),
  );
  assert.equal(stored.formatVersion, CURRENT_LAYOUT_FORMAT_VERSION);
  assert.equal(stored.buttons.length, 1);
  assert.equal(stored.buttons[0].position.x, 225);
  const restored = repository.read("custom") as ReturnType<
    typeof createDefaultLayout
  >;
  assert.equal(restored.totalbuttonshow, 1);
  assert.equal(restored.buttons[0].x, "225");
});

test("LayoutRepository atomically imports a layout package with its assets", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  const layout = createDefaultLayout();
  layout.name = "imported";
  layout.background.image = "background.png";
  const archive = await createLayoutPackage(layout, async () => PNG_BYTES);

  const result = await repository.importPackage(archive);

  assert.equal(result.name, "imported");
  assert.equal(result.layout.background.image, "background.png");
  assert.deepEqual(
    readFileSync(join(user, "imported", "background.png")),
    Buffer.from(PNG_BYTES),
  );
  assert.equal(
    JSON.parse(readFileSync(join(user, "imported", "layout.json"), "utf8"))
      .formatVersion,
    CURRENT_LAYOUT_FORMAT_VERSION,
  );
});

test("LayoutRepository gives an imported package its own id", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  const source = createDefaultLayout();
  source.name = "shared";
  source.id = "8f14e45f-ceea-467a-9575-0e02b2c3d479";
  repository.save("shared", source);
  const archive = await createLayoutPackage(source, async () => undefined);

  const result = await repository.importPackage(archive);

  assert.equal(result.name, "shared-2");
  assert.equal(result.layout.id, "shared-2");
  assert.notEqual(repository.read("shared-2").id, repository.read("shared").id);
});

test("LayoutRepository imports packages under a new name without overwriting", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  mkdirSync(join(user, "imported"), { recursive: true });
  writeFileSync(join(user, "imported", "keep.txt"), "keep");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  const layout = createDefaultLayout();
  layout.name = "imported";
  const archive = await createLayoutPackage(layout, async () => undefined);

  const result = await repository.importPackage(archive);

  assert.equal(result.name, "imported-2");
  assert.equal(
    readFileSync(join(user, "imported", "keep.txt"), "utf8"),
    "keep",
  );
  assert.equal(existsSync(join(user, "imported-2", "layout.json")), true);
});

test("LayoutRepository leaves no staging data for an invalid package", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });

  await assert.rejects(repository.importPackage(Uint8Array.from([1, 2, 3])));

  assert.equal(existsSync(user), false);
});

test("LayoutRepository save removes unreferenced assets", (t) => {
  const root = mkdtempSync(join(tmpdir(), "myogi-ban-layouts-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const user = join(root, "user");
  const custom = join(user, "custom");
  mkdirSync(custom, { recursive: true });
  writeFileSync(join(custom, "keep.png"), "keep");
  writeFileSync(join(custom, "stale.png"), "stale");
  const repository = new LayoutRepository({
    builtinLayoutDir: join(root, "builtin"),
    userLayoutDir: user,
    defaultLayoutFile: join(root, "default.json"),
  });
  const layout = createDefaultLayout();
  layout.background.image = "keep.png";

  repository.save("custom", layout);

  assert.equal(existsSync(join(custom, "keep.png")), true);
  assert.equal(existsSync(join(custom, "stale.png")), false);
  assert.equal(existsSync(join(custom, "layout.json")), true);
});
