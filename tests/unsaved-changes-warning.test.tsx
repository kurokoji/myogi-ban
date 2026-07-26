// biome-ignore assist/source/organizeImports: DOM setup must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { componentDom } from "./component-dom";
import { renderHook } from "@testing-library/react";
import { useUnsavedChangesWarning } from "../src/hooks/useUnsavedChangesWarning";

test("unsaved editor changes prevent browser unload", () => {
  const { unmount } = renderHook(() => useUnsavedChangesWarning(true));
  const event = new componentDom.window.Event("beforeunload", {
    cancelable: true,
  });

  componentDom.window.dispatchEvent(event);

  assert.equal(event.defaultPrevented, true);
  unmount();
});

test("a clean editor does not prevent browser unload", () => {
  renderHook(() => useUnsavedChangesWarning(false));
  const event = new componentDom.window.Event("beforeunload", {
    cancelable: true,
  });

  componentDom.window.dispatchEvent(event);

  assert.equal(event.defaultPrevented, false);
});
