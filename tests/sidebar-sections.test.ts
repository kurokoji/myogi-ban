import assert from "node:assert/strict";
import test from "node:test";
import {
  readOpenSidebarSections,
  writeOpenSidebarSections,
} from "../src/sidebar-sections";

test("sidebar sections restore their persisted open state", () => {
  const storage = {
    getItem: () => JSON.stringify(["layout", "buttons"]),
  };

  assert.deepEqual(readOpenSidebarSections(storage, ["display"]), [
    "layout",
    "buttons",
  ]);
});

test("sidebar sections use defaults when persisted state is invalid", () => {
  const storage = { getItem: () => "not-json" };

  assert.deepEqual(readOpenSidebarSections(storage, ["display"]), ["display"]);
});

test("sidebar sections persist their updated open state", () => {
  let savedKey = "";
  let savedValue = "";
  const storage = {
    setItem: (key: string, value: string) => {
      savedKey = key;
      savedValue = value;
    },
  };

  writeOpenSidebarSections(storage, ["layout", "stick"]);

  assert.equal(savedKey, "editor-sidebar-sections");
  assert.equal(savedValue, '["layout","stick"]');
});
