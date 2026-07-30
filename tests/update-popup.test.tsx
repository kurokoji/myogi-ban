import assert from "node:assert/strict";
import test from "node:test";
import { fireEvent } from "@testing-library/react";
import type React from "react";
import { UpdatePopup } from "../src/components/editor/UpdatePopup";
import type { UpdateStatus } from "../src/update-manager";
import { renderComponent } from "./component-render";

function idleStatus(overrides: Partial<UpdateStatus> = {}): UpdateStatus {
  return {
    currentVersion: "1.0.17",
    latestVersion: "1.0.18",
    updateAvailable: true,
    installSupported: true,
    releaseUrl: "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
    download: { state: "idle" },
    obsPluginAvailable: false,
    obsPluginDownload: { state: "idle" },
    ...overrides,
  };
}

function renderPopup(
  props: Partial<React.ComponentProps<typeof UpdatePopup>> = {},
) {
  return renderComponent(
    <UpdatePopup
      status={idleStatus()}
      dismissed={false}
      actionError={null}
      onClose={() => {}}
      onDownload={() => {}}
      onInstall={() => {}}
      {...props}
    />,
  );
}

test("renders nothing when there is no status yet", () => {
  const view = renderPopup({ status: null });
  assert.equal(view.queryByRole("dialog") === null, true);
});

test("renders nothing when no update is available", () => {
  const view = renderPopup({ status: idleStatus({ updateAvailable: false }) });
  assert.equal(view.queryByRole("dialog") === null, true);
});

test("renders nothing when dismissed", () => {
  const view = renderPopup({ dismissed: true });
  assert.equal(view.queryByRole("dialog") === null, true);
});

test("shows the available version and a download button", () => {
  const view = renderPopup();
  assert.ok(view.getByRole("dialog"));
  assert.ok(view.getByText("updateAvailable"));
  assert.ok(view.getByRole("button", { name: "downloadUpdate" }));
});

test("shows a link to the release page when install is not supported", () => {
  const view = renderPopup({ status: idleStatus({ installSupported: false }) });

  const link = view.getByRole("link", {
    name: "openReleasePage",
  }) as HTMLAnchorElement;
  assert.equal(
    link.href,
    "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
  );
  assert.equal(
    view.queryByRole("button", { name: "downloadUpdate" }) === null,
    true,
  );
});

test("clicking download calls onDownload", () => {
  let calls = 0;
  const view = renderPopup({
    onDownload: () => {
      calls += 1;
    },
  });

  fireEvent.click(view.getByRole("button", { name: "downloadUpdate" }));

  assert.equal(calls, 1);
});

test("shows download progress as a percentage", () => {
  const view = renderPopup({
    status: idleStatus({ download: { state: "downloading", progress: 0.42 } }),
  });

  assert.ok(view.getByText("42%"));
});

test("shows an install button once downloaded and calls onInstall on click", () => {
  let calls = 0;
  const view = renderPopup({
    status: idleStatus({
      download: { state: "downloaded", installerPath: "C:/tmp/setup.exe" },
    }),
    onInstall: () => {
      calls += 1;
    },
  });

  fireEvent.click(view.getByRole("button", { name: "installUpdate" }));

  assert.equal(calls, 1);
});

test("shows the download error message and still offers a retry download button", () => {
  const view = renderPopup({
    status: idleStatus({
      download: { state: "error", message: "network down" },
    }),
  });

  assert.ok(view.getByText("network down"));
  assert.ok(view.getByRole("button", { name: "downloadUpdate" }));
});

test("shows the action error text when provided", () => {
  const view = renderPopup({ actionError: "something broke" });
  assert.ok(view.getByText("something broke"));
});

test("does not render OBS plugin controls; those live outside the popup", () => {
  const view = renderPopup({
    status: idleStatus({ obsPluginAvailable: true }),
  });

  assert.equal(
    view.queryByRole("button", { name: "downloadObsPluginUpdate" }) === null,
    true,
  );
});

test("clicking close calls onClose", () => {
  let calls = 0;
  const view = renderPopup({
    onClose: () => {
      calls += 1;
    },
  });

  fireEvent.click(view.getByRole("button", { name: /close/i }));

  assert.equal(calls, 1);
});
