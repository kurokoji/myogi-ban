// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import "./component-render";
import { act, renderHook } from "@testing-library/react";
import type { ApiClient } from "../src/api";
import { useEditorLayouts } from "../src/hooks/useEditorLayouts";
import { createDefaultLayout } from "../src/layout";

const baseMessages = {
  saved: "saved",
  defaultSaved: "default saved",
  invalidLayoutFile: "invalid",
  layoutPackageImageInvalid: "invalid image",
  layoutPackageTooLarge: "too large",
  layoutPackageUnsafe: "unsafe",
  operationFailed: "failed",
  discardChanges: "discard",
  discardAndOpen: "discard and open",
  discardAndImport: "discard and import",
  confirmDelete: "delete",
  deleteLayout: "delete this layout",
  deleted: "deleted",
  layoutNameExists: "exists",
};

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
    messages: baseMessages,
  };
  const { result } = renderHook(() => useEditorLayouts(options));

  await act(async () => result.current.saveLayout());

  assert.equal(saveCalls, 1);
  assert.equal(clearHistoryCalls, 0);
});

test("opening a layout with unsaved changes defers to a confirmation instead of a blocking dialog", async () => {
  const getLayoutCalls: string[] = [];
  const api = {
    getDefaultLayout: async () => {
      throw new Error("no default layout");
    },
    getLayouts: async () => [],
    getLayout: async (name: string) => {
      getLayoutCalls.push(name);
      return createDefaultLayout();
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
    clearLayoutHistory: () => {},
    updateLayout: ignoreUpdate,
    messages: baseMessages,
  };
  const { result } = renderHook(() => useEditorLayouts(options));
  await act(async () => {});

  act(() => {
    result.current.openLayout("other:user");
  });

  assert.equal(result.current.pendingConfirmation?.message, "discard");
  assert.equal(
    result.current.pendingConfirmation?.confirmLabel,
    "discard and open",
  );
  assert.deepEqual(getLayoutCalls, []);

  await act(async () => result.current.confirmPendingAction());

  assert.deepEqual(getLayoutCalls, ["other"]);
  assert.equal(result.current.pendingConfirmation, null);
});

test("canceling a pending confirmation leaves the layout untouched", async () => {
  const getLayoutCalls: string[] = [];
  const api = {
    getDefaultLayout: async () => {
      throw new Error("no default layout");
    },
    getLayouts: async () => [],
    getLayout: async (name: string) => {
      getLayoutCalls.push(name);
      return createDefaultLayout();
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
    clearLayoutHistory: () => {},
    updateLayout: ignoreUpdate,
    messages: baseMessages,
  };
  const { result } = renderHook(() => useEditorLayouts(options));
  await act(async () => {});

  act(() => {
    result.current.openLayout("other:user");
  });
  act(() => {
    result.current.cancelPendingAction();
  });

  assert.equal(result.current.pendingConfirmation, null);
  assert.deepEqual(getLayoutCalls, []);
});

test("deleting a layout defers to a confirmation instead of a blocking dialog", async () => {
  const deleteCalls: string[] = [];
  const api = {
    getDefaultLayout: async () => ({ name: "mypreset" }),
    getLayouts: async () => [],
    deleteLayout: async (name: string) => {
      deleteCalls.push(name);
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
    clearLayoutHistory: () => {},
    updateLayout: ignoreUpdate,
    messages: baseMessages,
  };
  const { result } = renderHook(() => useEditorLayouts(options));
  await act(async () => {});

  act(() => {
    result.current.deleteLayout();
  });

  assert.equal(result.current.pendingConfirmation?.message, "delete");
  assert.equal(
    result.current.pendingConfirmation?.confirmLabel,
    "delete this layout",
  );
  assert.deepEqual(deleteCalls, []);

  await act(async () => result.current.confirmPendingAction());

  assert.deepEqual(deleteCalls, ["mypreset"]);
});
