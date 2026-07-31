import assert from "node:assert/strict";
import test from "node:test";
import { fireEvent } from "@testing-library/react";
import type React from "react";
import { ObsSetupPanel } from "../src/components/editor/ObsSetupPanel";
import { renderComponent } from "./component-render";

function renderPanel(
  props: Partial<React.ComponentProps<typeof ObsSetupPanel>> = {},
) {
  return renderComponent(
    <ObsSetupPanel
      obsUrl="http://localhost:3000/view"
      copiedObsUrl={false}
      onCopyObsUrl={() => {}}
      obsPluginAvailable={false}
      obsPluginDownload={{ state: "idle" }}
      onDownloadObsPlugin={() => {}}
      onInstallObsPlugin={() => {}}
      installingObsPlugin={false}
      {...props}
    />,
  );
}

test("shows the viewer URL and a copy button", () => {
  const view = renderPanel();
  assert.ok(view.getByText("http://localhost:3000/view"));
  assert.ok(view.getByRole("button", { name: "copy" }));
});

test("clicking copy calls onCopyObsUrl", () => {
  let calls = 0;
  const view = renderPanel({
    onCopyObsUrl: () => {
      calls += 1;
    },
  });

  fireEvent.click(view.getByRole("button", { name: "copy" }));

  assert.equal(calls, 1);
});

test("shows copied feedback only after copying", () => {
  const view = renderPanel({ copiedObsUrl: true });
  assert.ok(view.getByText("copied"));
});

test("does not show OBS plugin controls when no plugin installer is available", () => {
  const view = renderPanel({ obsPluginAvailable: false });
  assert.equal(
    view.queryByRole("button", { name: "downloadObsPluginUpdate" }) === null,
    true,
  );
});

test("shows OBS plugin controls when a plugin installer is available", () => {
  const view = renderPanel({ obsPluginAvailable: true });
  assert.ok(view.getByRole("button", { name: "downloadObsPluginUpdate" }));
});

test("forwards installingObsPlugin to the OBS plugin install button", () => {
  const view = renderPanel({
    obsPluginAvailable: true,
    obsPluginDownload: {
      state: "downloaded",
      installerPath: "C:/tmp/obs-setup.exe",
    },
    installingObsPlugin: true,
  });

  const button = view.getByRole("button", {
    name: "installObsPluginUpdate",
  }) as HTMLButtonElement;
  assert.equal(button.disabled, true);
});
