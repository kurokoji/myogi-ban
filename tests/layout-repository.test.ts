import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createDefaultLayout } from "../src/layout";
import {
  collectLayoutAssets,
  LayoutRepository,
} from "../src/layout-repository";

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
