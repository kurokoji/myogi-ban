import assert from "node:assert/strict";
import test from "node:test";
import "./component-dom";
import { act, renderHook } from "@testing-library/react";
import type { ApiClient } from "../src/api";
import { useWhatsNew } from "../src/hooks/useWhatsNew";
import type { ReleaseNotes, WhatsNewStatus } from "../src/whats-new-manager";

function status(overrides: Partial<WhatsNewStatus> = {}): WhatsNewStatus {
  return {
    show: true,
    version: "1.0.18",
    notes: "- auto notes",
    releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
    ...overrides,
  };
}

function fakeApi(overrides: Partial<ApiClient> = {}) {
  return {
    getWhatsNew: async () => status(),
    getCurrentReleaseNotes: async (): Promise<ReleaseNotes> => ({
      version: "1.0.18",
      notes: "- manual notes",
      releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
    }),
    ...overrides,
  } as unknown as ApiClient;
}

test("shows the popup automatically when the check reports a fresh update", async () => {
  const api = fakeApi();
  const { result, unmount } = renderHook(() => useWhatsNew(api));

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  assert.deepEqual(result.current.popup, {
    version: "1.0.18",
    notes: "- auto notes",
    releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
  });
  unmount();
});

test("does not show the popup automatically when nothing changed", async () => {
  const api = fakeApi({ getWhatsNew: async () => status({ show: false }) });
  const { result, unmount } = renderHook(() => useWhatsNew(api));

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  assert.equal(result.current.popup, null);
  unmount();
});

test("viewNotes fetches and shows notes for the current version on demand", async () => {
  const api = fakeApi({ getWhatsNew: async () => status({ show: false }) });
  const { result, unmount } = renderHook(() => useWhatsNew(api));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.equal(result.current.popup, null);

  await act(async () => {
    await result.current.viewNotes();
  });

  assert.deepEqual(result.current.popup, {
    version: "1.0.18",
    notes: "- manual notes",
    releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
  });
  unmount();
});

test("dismiss clears the popup", async () => {
  const api = fakeApi();
  const { result, unmount } = renderHook(() => useWhatsNew(api));
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
  assert.notEqual(result.current.popup, null);

  act(() => result.current.dismiss());

  assert.equal(result.current.popup, null);
  unmount();
});
