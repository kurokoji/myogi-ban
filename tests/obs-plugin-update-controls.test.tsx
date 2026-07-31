import assert from "node:assert/strict";
import test from "node:test";
import { fireEvent } from "@testing-library/react";
import type React from "react";
import { ObsPluginUpdateControls } from "../src/components/editor/ObsPluginUpdateControls";
import type { UpdateDownloadState } from "../src/update-manager";
import { renderComponent } from "./component-render";

function renderControls(
  props: Partial<React.ComponentProps<typeof ObsPluginUpdateControls>> = {},
) {
  return renderComponent(
    <ObsPluginUpdateControls
      download={{ state: "idle" }}
      onDownload={() => {}}
      onInstall={() => {}}
      installing={false}
      {...props}
    />,
  );
}

test("shows a download button when idle", () => {
  const view = renderControls();
  assert.ok(view.getByRole("button", { name: "downloadObsPluginUpdate" }));
});

test("clicking download calls onDownload", () => {
  let calls = 0;
  const view = renderControls({
    onDownload: () => {
      calls += 1;
    },
  });

  fireEvent.click(
    view.getByRole("button", { name: "downloadObsPluginUpdate" }),
  );

  assert.equal(calls, 1);
});

test("shows download progress as a percentage", () => {
  const view = renderControls({
    download: { state: "downloading", progress: 0.42 },
  });

  assert.ok(view.getByText("42%"));
});

test("shows an install button once downloaded and calls onInstall on click", () => {
  let calls = 0;
  const view = renderControls({
    download: { state: "downloaded", installerPath: "C:/tmp/obs-setup.exe" },
    onInstall: () => {
      calls += 1;
    },
  });

  fireEvent.click(view.getByRole("button", { name: "installObsPluginUpdate" }));

  assert.equal(calls, 1);
});

test("shows the install button as loading and disabled while installing", () => {
  const view = renderControls({
    download: { state: "downloaded", installerPath: "C:/tmp/obs-setup.exe" },
    installing: true,
  });

  const button = view.getByRole("button", {
    name: "installObsPluginUpdate",
  }) as HTMLButtonElement;
  assert.equal(button.disabled, true);
});

test("shows the download error message and still offers a retry download button", () => {
  const errorState: UpdateDownloadState = {
    state: "error",
    message: "obs network down",
  };
  const view = renderControls({ download: errorState });

  assert.ok(view.getByText("obs network down"));
  assert.ok(view.getByRole("button", { name: "downloadObsPluginUpdate" }));
});
