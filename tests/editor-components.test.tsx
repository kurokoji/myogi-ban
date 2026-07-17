// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { componentDocument, renderComponent } from "./component-render";
import { fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { LayoutSettingsPanel } from "../src/components/editor/LayoutSettingsPanel";
import { LinkedSizeInputs } from "../src/components/editor/LinkedSizeInputs";
import { ButtonLayer } from "../src/components/gamepad/ButtonLayer";
import { GamepadView } from "../src/components/GamepadView";
import { createDefaultLayout } from "../src/layout";

test("duplicate layout names disable save-as before submitting", async () => {
  let saveCalls = 0;
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[{ name: "existing", builtin: true }]}
      selectedLayout="existing:builtin"
      layoutName="existing"
      currentBuiltin={true}
      isDirty={false}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => {
        saveCalls += 1;
        return true;
      }}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
    />,
  );
  const user = userEvent.setup({ document: componentDocument });

  await user.click(view.getByRole("button", { name: "saveAs" }));
  const input = view.getByRole("textbox", { name: "layoutName" });
  await user.clear(input);
  await user.type(input, "existing");

  assert.equal(
    view
      .getByRole("button", { name: "save", exact: true })
      .hasAttribute("disabled"),
    true,
  );
  assert.equal(saveCalls, 0);
});

test("linked size inputs update height and can unlink the ratio", async () => {
  function Example() {
    const [size, setSize] = useState({ width: "100", height: "50" });
    return (
      <LinkedSizeInputs
        width={size.width}
        height={size.height}
        widthLabel="Width"
        heightLabel="Height"
        onChange={(width, height) => setSize({ width, height })}
      />
    );
  }

  const view = renderComponent(<Example />);
  const user = userEvent.setup({ document: componentDocument });
  const width = view.getByRole("textbox", { name: "Width" });
  const height = view.getByRole("textbox", { name: "Height" });
  fireEvent.change(width, { target: { value: "200" } });
  assert.equal((height as HTMLInputElement).value, "100");

  await user.click(view.getByRole("button", { name: "unlinkAspectRatio" }));
  fireEvent.change(width, { target: { value: "300" } });
  assert.equal((height as HTMLInputElement).value, "100");
});

test("button layer renders every member of a multiple selection", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 3;
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndex={0}
      selectedButtonIndexes={[0, 2]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  assert.equal(view.container.querySelectorAll(".button-selected").length, 2);
  assert.equal(view.container.querySelector("#button1.button-selected"), null);
});

test("control-clicking the stick center requests selection toggle", () => {
  const layout = createDefaultLayout();
  const clicks: Array<{ index: number; toggle: boolean }> = [];
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      onStickClick={(index, toggle) => clicks.push({ index, toggle })}
    />,
  );

  const handle = view.container.querySelector(".stick-drag-handle");
  assert.ok(handle);
  fireEvent.click(handle, { ctrlKey: true });

  assert.deepEqual(clicks, [{ index: 0, toggle: true }]);
});
