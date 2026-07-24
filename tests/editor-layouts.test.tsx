// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import "./component-render";
import { act, renderHook } from "@testing-library/react";
import type { ApiClient } from "../src/api";
import { useEditorLayouts } from "../src/hooks/useEditorLayouts";
import { createDefaultLayout } from "../src/layout";

test("saving a layout preserves editor undo history", async () => {
  let saveCalls = 0;
  let clearHistoryCalls = 0;
  const api = {
    getDefaultLayout: async () => {
      throw new Error("no default layout");
    },
    getLayouts: async () => [],
    saveLayout: async () => {
      saveCalls += 1;
    },
  } as unknown as ApiClient;
  const layout = createDefaultLayout();
  const ignoreUpdate = () => {};
  const options = {
    api,
    layout,
    buttonMappings: [],
    stickMappings: [],
    setButtonMappings: ignoreUpdate,
    setStickMappings: ignoreUpdate,
    setSelection: ignoreUpdate,
    restoreLayout: ignoreUpdate,
    clearLayoutHistory: () => {
      clearHistoryCalls += 1;
    },
    updateLayout: ignoreUpdate,
    messages: {
      saved: "saved",
      defaultSaved: "default saved",
      invalidLayoutFile: "invalid",
      layoutPackageImageInvalid: "invalid image",
      layoutPackageTooLarge: "too large",
      layoutPackageUnsafe: "unsafe",
      operationFailed: "failed",
      discardChanges: "discard",
      confirmDelete: "delete",
      deleted: "deleted",
      layoutNameExists: "exists",
    },
  };
  const { result } = renderHook(() => useEditorLayouts(options));

  await act(async () => result.current.saveLayout());

  assert.equal(saveCalls, 1);
  assert.equal(clearHistoryCalls, 0);
});
