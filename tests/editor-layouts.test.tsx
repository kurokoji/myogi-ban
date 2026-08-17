// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import "./component-render";
import { act, renderHook } from "@testing-library/react";
import { type ApiClient, ApiError } from "../src/api";
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
  renamed: "renamed",
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
    getDefaultLayout: async () => ({ id: "mypreset" }),
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

test("renaming a layout calls the API and updates the current layout name", async () => {
  const renameCalls: Array<[string, string]> = [];
  const api = {
    getDefaultLayout: async () => {
      throw new Error("no default layout");
    },
    getLayouts: async () => [],
    renameLayout: async (name: string, newName: string) => {
      renameCalls.push([name, newName]);
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

  const renamed = await act(async () => result.current.renameLayout("renamed"));

  assert.equal(renamed, true);
  assert.deepEqual(renameCalls, [["mypreset", "renamed"]]);
  assert.equal(result.current.layoutName, "renamed");
  assert.equal(result.current.status?.kind, "success");
  assert.equal(result.current.status?.message, "renamed");
});

test("renaming to a name already in use reports an error without calling the API", async () => {
  let renameCalls = 0;
  const api = {
    getDefaultLayout: async () => {
      throw new Error("no default layout");
    },
    getLayouts: async () => [{ name: "taken", builtin: false }],
    renameLayout: async () => {
      renameCalls += 1;
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

  const renamed = await act(async () => result.current.renameLayout("taken"));

  assert.equal(renamed, false);
  assert.equal(renameCalls, 0);
  assert.equal(result.current.status?.kind, "error");
  assert.equal(result.current.status?.message, "exists");
});

test("renaming the default layout keeps it marked as default under its new name", async () => {
  const api = {
    getDefaultLayout: async () => ({ id: "mypreset" }),
    getLayouts: async () => [],
    renameLayout: async () => {},
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
  assert.equal(result.current.isDefaultLayout, true);

  await act(async () => result.current.renameLayout("renamed"));

  assert.equal(result.current.layoutName, "renamed");
  assert.equal(result.current.isDefaultLayout, true);
});

test("a failed rename reports the generic operation-failed message", async () => {
  const api = {
    getDefaultLayout: async () => {
      throw new Error("no default layout");
    },
    getLayouts: async () => [],
    renameLayout: async () => {
      throw new ApiError(500, "POST", "/api/layouts/mypreset/rename");
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

  const renamed = await act(async () => result.current.renameLayout("renamed"));

  assert.equal(renamed, false);
  assert.equal(result.current.status?.kind, "error");
  assert.equal(result.current.status?.message, "failed");
});
