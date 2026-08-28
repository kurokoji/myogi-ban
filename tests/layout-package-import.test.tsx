// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import "./component-render";
import { act, renderHook } from "@testing-library/react";
import type { ApiClient } from "../src/api";
import { useLayoutPackageImport } from "../src/hooks/useLayoutPackageImport";
import { createDefaultLayout } from "../src/layout";
import { createLayoutPackage } from "../src/layout-package";

const messages = {
  saved: "saved",
  invalidLayoutFile: "invalid",
  layoutPackageImageInvalid: "invalid image",
  layoutPackageTooLarge: "too large",
  layoutPackageUnsafe: "unsafe",
};

async function makePackageFile(name = "preset") {
  const layout = createDefaultLayout();
  layout.name = name;
  const archive = await createLayoutPackage(layout, async () => undefined);
  const data = new Uint8Array(archive);
  return {
    name: `${name}.myogi`,
    arrayBuffer: async () => data.buffer,
  } as unknown as File;
}

function setup(api: Partial<ApiClient> = {}) {
  const calls = {
    applied: [] as unknown[],
    refreshed: 0,
    selected: [] as string[],
  };
  const view = renderHook(() =>
    useLayoutPackageImport({
      api: api as ApiClient,
      applyLayout: (data, name) => calls.applied.push({ data, name }),
      refreshLayouts: async () => {
        calls.refreshed += 1;
        return [];
      },
      setSelectedLayout: (selection) => calls.selected.push(selection),
      setStatus: () => {},
      messages,
    }),
  );
  return { view, calls };
}

test("inspectPackageFile exposes a preview of the package", async () => {
  const { view } = setup();
  const file = await makePackageFile("my-layout");

  await act(async () => {
    await view.result.current.inspectPackageFile(file);
  });

  assert.equal(view.result.current.pendingImport?.name, "my-layout");
});

test("confirmImport imports the pending package and applies the result", async () => {
  let importedBytes: Uint8Array | null = null;
  const { view, calls } = setup({
    importLayoutPackage: async (data: Uint8Array) => {
      importedBytes = data;
      return {
        layout: { ...createDefaultLayout(), id: "abc" },
        name: "my-layout",
      };
    },
  } as Partial<ApiClient>);
  const file = await makePackageFile("my-layout");
  await act(async () => {
    await view.result.current.inspectPackageFile(file);
  });

  await act(async () => {
    await view.result.current.confirmImport();
  });

  assert.ok(importedBytes);
  assert.equal(calls.applied.length, 1);
  assert.equal(view.result.current.pendingImport, null);
  assert.deepEqual(calls.selected, ["abc:user"]);
});

test("cancelImport clears a pending package", async () => {
  const { view } = setup();
  const file = await makePackageFile();
  await act(async () => {
    await view.result.current.inspectPackageFile(file);
  });

  act(() => {
    view.result.current.cancelImport();
  });

  assert.equal(view.result.current.pendingImport, null);
});
