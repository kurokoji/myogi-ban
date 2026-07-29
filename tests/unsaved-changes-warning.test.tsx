// biome-ignore assist/source/organizeImports: DOM setup must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { componentDom } from "./component-dom";
import { act, renderHook } from "@testing-library/react";
import { useUnsavedChangesWarning } from "../src/hooks/useUnsavedChangesWarning";

function dispatchBeforeUnload(): Event {
  const event = new componentDom.window.Event("beforeunload", {
    cancelable: true,
  });
  act(() => {
    componentDom.window.dispatchEvent(event);
  });
  return event;
}

test("unsaved editor changes prevent browser unload", () => {
  const { unmount } = renderHook(() => useUnsavedChangesWarning(true, false));

  const event = dispatchBeforeUnload();

  assert.equal(event.defaultPrevented, true);
  unmount();
});

test("a clean editor does not prevent browser unload", () => {
  const { unmount } = renderHook(() => useUnsavedChangesWarning(false, false));

  const event = dispatchBeforeUnload();

  assert.equal(event.defaultPrevented, false);
  unmount();
});

test("unsaved changes outside Electron rely on the native dialog, not an in-app modal", () => {
  const { result, unmount } = renderHook(() =>
    useUnsavedChangesWarning(true, false),
  );

  dispatchBeforeUnload();

  assert.equal(result.current.confirmingClose, false);
  unmount();
});

test("unsaved changes in Electron show an in-app confirmation instead of blocking natively", () => {
  const { result, unmount } = renderHook(() =>
    useUnsavedChangesWarning(true, true),
  );

  dispatchBeforeUnload();

  assert.equal(result.current.confirmingClose, true);
  unmount();
});

test("canceling the close confirmation keeps warning on the next attempt", () => {
  const { result, unmount } = renderHook(() =>
    useUnsavedChangesWarning(true, true),
  );

  dispatchBeforeUnload();
  assert.equal(result.current.confirmingClose, true);

  act(() => result.current.cancelClose());
  assert.equal(result.current.confirmingClose, false);

  const secondEvent = dispatchBeforeUnload();
  assert.equal(secondEvent.defaultPrevented, true);
  unmount();
});

test("confirming the close stops warning on the next unload attempt", () => {
  const originalClose = componentDom.window.close;
  componentDom.window.close = () => {};
  const { result, unmount } = renderHook(() =>
    useUnsavedChangesWarning(true, true),
  );

  dispatchBeforeUnload();
  assert.equal(result.current.confirmingClose, true);

  act(() => result.current.confirmClose());
  assert.equal(result.current.confirmingClose, false);

  const secondEvent = dispatchBeforeUnload();
  assert.equal(secondEvent.defaultPrevented, false);

  componentDom.window.close = originalClose;
  unmount();
});
