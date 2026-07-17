// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { componentDocument, renderComponent } from "./component-render";
import { fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { LayoutSettingsPanel } from "../src/components/editor/LayoutSettingsPanel";
import { LinkedSizeInputs } from "../src/components/editor/LinkedSizeInputs";
import { PreviewZoomControls } from "../src/components/editor/PreviewZoomControls";
import { SidebarAccordion } from "../src/components/editor/SidebarAccordion";
import { ButtonLayer } from "../src/components/gamepad/ButtonLayer";
import { ButtonAdvancedSettings } from "../src/components/editor/ButtonSettingsSections";
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

test("layout panel keeps secondary actions in a more menu", async () => {
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[{ name: "custom", builtin: false }]}
      selectedLayout="custom:user"
      layoutName="custom"
      currentBuiltin={false}
      isDirty={false}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => true}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
    />,
  );
  const user = userEvent.setup({ document: componentDocument });
  const panel = within(view.container);

  assert.equal(panel.queryByRole("button", { name: "deleteLayout" }), null);
  const moreButton = panel.getByRole("button", { name: "moreActions" });
  await user.click(moreButton);
  assert.equal(moreButton.getAttribute("aria-expanded"), "true");
  assert.ok(panel.getByRole("menuitem", { name: "setDefault", hidden: true }));
  assert.ok(panel.getByRole("menuitem", { name: "export", hidden: true }));
  assert.ok(panel.getByRole("menuitem", { name: "import", hidden: true }));
  assert.ok(
    panel.getByRole("menuitem", { name: "deleteLayout", hidden: true }),
  );
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

test("zoom percentage resets zoom without a separate reset button", async () => {
  const changes: number[] = [];
  const view = renderComponent(
    <PreviewZoomControls
      zoomPercent={140}
      canZoomIn={true}
      canZoomOut={true}
      onZoomIn={() => {}}
      onZoomOut={() => {}}
      onReset={() => changes.push(1)}
    />,
  );
  const controls = within(view.container);
  const user = userEvent.setup({ document: componentDocument });

  assert.equal(controls.getAllByRole("button").length, 3);
  await user.click(controls.getByRole("button", { name: "resetZoom" }));
  assert.deepEqual(changes, [1]);
  assert.equal(
    controls.getByRole("button", { name: "resetZoom" }).textContent,
    "140%",
  );
});

test("sidebar accordion restores persisted open sections", () => {
  const values = new Map<string, string>([
    ["editor-sidebar-sections", '["layout"]'],
  ]);
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  const view = renderComponent(
    <SidebarAccordion
      storage={storage}
      sections={[
        { value: "display", label: "Display", content: <p>Display body</p> },
        { value: "layout", label: "Layout", content: <p>Layout body</p> },
      ]}
    />,
  );
  const controls = view.container.querySelectorAll<HTMLButtonElement>(
    ".sidebar-accordion button",
  );
  assert.equal(controls.length, 2);
  assert.equal(
    view.container.querySelectorAll(".mantine-Accordion-item[data-active]")
      .length,
    1,
  );
});

test("advanced button settings stay collapsed until requested", () => {
  const view = renderComponent(
    <ButtonAdvancedSettings label="Advanced">
      <p>Advanced content</p>
    </ButtonAdvancedSettings>,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  assert.equal(details.open, false);

  fireEvent.click(within(view.container).getByText("Advanced"));

  assert.equal(details.open, true);
});
