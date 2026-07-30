import assert from "node:assert/strict";
import test from "node:test";
import "./component-dom";
import { act, renderHook } from "@testing-library/react";
import type React from "react";
import { I18nextProvider } from "react-i18next";
import type { ApiClient } from "../src/api";
import { useUpdateStatus } from "../src/hooks/useUpdateStatus";
import type { UpdateStatus } from "../src/update-manager";
import { testI18n } from "./component-render";

function wrapper({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>;
}

function idleStatus(overrides: Partial<UpdateStatus> = {}): UpdateStatus {
  return {
    currentVersion: "1.0.17",
    latestVersion: "1.0.18",
    updateAvailable: true,
    installSupported: true,
    releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
    download: { state: "idle" },
    ...overrides,
  };
}

function fakeApi(
  responses: UpdateStatus[],
  overrides: Partial<ApiClient> = {},
) {
  let call = 0;
  return {
    getUpdateStatus: async () =>
      responses[Math.min(call++, responses.length - 1)],
    checkForUpdate: async () => responses[responses.length - 1],
    startUpdateDownload: async () => {},
    installUpdate: async () => {},
    ...overrides,
  } as unknown as ApiClient;
}

test("fetches the update status once on mount", async () => {
  let calls = 0;
  const api = fakeApi([idleStatus({ updateAvailable: false })], {
    getUpdateStatus: async () => {
      calls += 1;
      return idleStatus({ updateAvailable: false });
    },
  });

  const { result, unmount } = renderHook(() => useUpdateStatus(api, 999999), {
    wrapper,
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  assert.equal(calls, 1);
  assert.equal(result.current.status?.updateAvailable, false);
  unmount();
});

test("checkNow forces a check and un-dismisses a previously dismissed popup", async () => {
  const api = fakeApi([idleStatus({ updateAvailable: false })], {
    checkForUpdate: async () => idleStatus(),
  });
  const { result, unmount } = renderHook(() => useUpdateStatus(api, 999999), {
    wrapper,
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  act(() => result.current.dismiss());
  assert.equal(result.current.dismissed, true);

  await act(async () => {
    await result.current.checkNow();
  });

  assert.equal(result.current.status?.updateAvailable, true);
  assert.equal(result.current.dismissed, false);
  unmount();
});

test("download starts the update and refreshes status", async () => {
  let downloadCalls = 0;
  const api = fakeApi(
    [
      idleStatus(),
      idleStatus({ download: { state: "downloading", progress: 0 } }),
    ],
    {
      startUpdateDownload: async () => {
        downloadCalls += 1;
      },
    },
  );
  const { result, unmount } = renderHook(() => useUpdateStatus(api, 999999), {
    wrapper,
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  await act(async () => {
    await result.current.download();
  });

  assert.equal(downloadCalls, 1);
  assert.equal(result.current.status?.download.state, "downloading");
  unmount();
});

test("install calls the API and reports a failure", async () => {
  const api = fakeApi([idleStatus()], {
    installUpdate: async () => {
      throw new Error("boom");
    },
  });
  const { result, unmount } = renderHook(() => useUpdateStatus(api, 999999), {
    wrapper,
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

  await act(async () => {
    await result.current.install();
  });

  assert.equal(result.current.actionError !== null, true);
  unmount();
});

test("polls for progress only while a download is in progress", async () => {
  let statusCalls = 0;
  const api = fakeApi(
    [
      idleStatus({ download: { state: "downloading", progress: 0 } }),
      idleStatus({ download: { state: "downloading", progress: 1 } }),
      idleStatus({ download: { state: "downloaded", installerPath: "x" } }),
    ],
    {
      getUpdateStatus: async () => {
        statusCalls += 1;
        if (statusCalls === 1)
          return idleStatus({
            download: { state: "downloading", progress: 0 },
          });
        if (statusCalls === 2)
          return idleStatus({
            download: { state: "downloading", progress: 1 },
          });
        return idleStatus({
          download: { state: "downloaded", installerPath: "x" },
        });
      },
    },
  );
  const { result, unmount } = renderHook(() => useUpdateStatus(api, 5), {
    wrapper,
  });

  for (
    let i = 0;
    i < 50 && result.current.status?.download.state !== "downloaded";
    i++
  ) {
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
  }

  assert.equal(result.current.status?.download.state, "downloaded");
  const callsAtDownloaded = statusCalls;

  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
  });
  assert.equal(statusCalls, callsAtDownloaded);
  unmount();
});
