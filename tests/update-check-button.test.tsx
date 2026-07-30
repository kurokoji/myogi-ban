import assert from "node:assert/strict";
import test from "node:test";
import { fireEvent } from "@testing-library/react";
import { UpdateCheckButton } from "../src/components/editor/UpdateCheckButton";
import { renderComponent } from "./component-render";

test("clicking the button calls onCheckNow", () => {
  let calls = 0;
  const view = renderComponent(
    <UpdateCheckButton
      checking={false}
      updateAvailable={false}
      onCheckNow={async () => {
        calls += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "checkForUpdates" }));

  assert.equal(calls, 1);
});

test("disables the button while a check is in progress", () => {
  const view = renderComponent(
    <UpdateCheckButton
      checking={true}
      updateAvailable={false}
      onCheckNow={async () => {}}
    />,
  );

  const button = view.getByRole("button", {
    name: "checkForUpdates",
  }) as HTMLButtonElement;
  assert.equal(button.disabled, true);
});

test('shows "up to date" feedback after a completed check finds no update', async () => {
  const view = renderComponent(
    <UpdateCheckButton
      checking={false}
      updateAvailable={false}
      onCheckNow={async () => {}}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "checkForUpdates" }));

  assert.ok(await view.findByText("upToDate"));
});

test("does not show up-to-date feedback when the check found an update", async () => {
  const view = renderComponent(
    <UpdateCheckButton
      checking={false}
      updateAvailable={true}
      onCheckNow={async () => {}}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "checkForUpdates" }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(view.queryByText("upToDate") === null, true);
});
