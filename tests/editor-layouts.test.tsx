// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import "./component-render";
import { act, renderHook } from "@testing-library/react";
import { type ApiClient, ApiError } from "../src/api";
import { useEditorLayouts } from "../src/hooks/useEditorLayouts";
import { isGeneratedLayoutId } from "../src/layout-id";
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

test("saving under a new name creates a layout with a generated id", async () => {
  const saved: Array<{ id: string; name: string }> = [];
  const api = {
    getDefaultLayout: async () => {
      throw new Error("no default layout");
    },
    getLayouts: async () => [],
    saveLayout: async (
      id: string,
      data: ReturnType<typeof createDefaultLayout>,
    ) => {
      saved.push({ id, name: data.name });
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

  await act(async () => {
    await result.current.saveLayoutAs("My Layout");
  });
  await act(async () => {
    await result.current.saveLayoutAs("My Other Layout");
  });

  assert.equal(saved.length, 2);
  assert.equal(saved[0].name, "My Layout");
  assert.equal(isGeneratedLayoutId(saved[0].id), true);
  assert.equal(isGeneratedLayoutId(saved[1].id), true);
  assert.notEqual(saved[0].id, saved[1].id);
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

test("renaming to a name another layout already uses is allowed", async () => {
  let renameCalls = 0;
  const api = {
    getDefaultLayout: async () => {
      throw new Error("no default layout");
    },
    getLayouts: async () => [{ id: "other", name: "taken", builtin: false }],
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

  assert.equal(renamed, true);
  assert.equal(renameCalls, 1);
  assert.equal(result.current.layoutName, "taken");
});

test("renaming keeps the renamed layout selected in the layout list", async () => {
  const api = {
    getDefaultLayout: async () => {
      throw new Error("no default layout");
    },
    getLayouts: async () => [],
    renameLayout: async () => {},
  } as unknown as ApiClient;
  const layout = createDefaultLayout();
  layout.id = "8f14e45f-ceea-467a-9575-0e02b2c3d479";
  layout.name = "before";
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

  await act(async () => result.current.renameLayout("after"));

  assert.equal(
    result.current.selectedLayout,
    "8f14e45f-ceea-467a-9575-0e02b2c3d479:user",
  );
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
