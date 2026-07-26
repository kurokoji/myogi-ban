import assert from "node:assert/strict";
import test from "node:test";
import {
  confirmElectronUnload,
  electronUnsavedChangesDialog,
} from "../src/electron-unsaved-changes";

test("Electron allows unload only after confirming unsaved changes", () => {
  let allowed = 0;
  const event = {
    preventDefault: () => {
      allowed += 1;
    },
  };

  confirmElectronUnload(event, () => false);
  assert.equal(allowed, 0);

  confirmElectronUnload(event, () => true);
  assert.equal(allowed, 1);
});

test("Electron unsaved changes dialog follows the application locale", () => {
  assert.deepEqual(electronUnsavedChangesDialog("ja-JP").buttons, [
    "破棄して終了",
    "キャンセル",
  ]);
  assert.deepEqual(electronUnsavedChangesDialog("en-US").buttons, [
    "Discard and quit",
    "Cancel",
  ]);
});
