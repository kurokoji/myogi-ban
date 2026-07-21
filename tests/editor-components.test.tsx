// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { componentDocument, renderComponent } from "./component-render";
import { fireEvent, within } from "@testing-library/react";
import { createRef, useState } from "react";
import { LayoutSettingsPanel } from "../src/components/editor/LayoutSettingsPanel";
import { DisplaySettingsPanel } from "../src/components/editor/DisplaySettingsPanel";
import { LinkedSizeInputs } from "../src/components/editor/LinkedSizeInputs";
import { PreviewZoomControls } from "../src/components/editor/PreviewZoomControls";
import { SidebarAccordion } from "../src/components/editor/SidebarAccordion";
import { ButtonLayer } from "../src/components/gamepad/ButtonLayer";
import { ButtonAdvancedSettings } from "../src/components/editor/ButtonSettingsSections";
import { GamepadView } from "../src/components/GamepadView";
import { SelectionOverlays } from "../src/components/gamepad/SelectionOverlays";
import { createDefaultLayout } from "../src/layout";
import { BackgroundSettingsPanel } from "../src/components/editor/SettingsPanels";
import { ThemeControl } from "../src/components/editor/ThemeControl";

test("component tests clean up rendered DOM after each test", () => {
  renderComponent(<p data-testid="cleanup-marker">Rendered</p>);
  assert.ok(componentDocument.querySelector('[data-testid="cleanup-marker"]'));
});

test("component tests start with an empty rendered DOM", () => {
  assert.equal(
    componentDocument.querySelector('[data-testid="cleanup-marker"]'),
    null,
  );
});

test("theme control selects automatic, light, and dark schemes with icons", () => {
  const view = renderComponent(<ThemeControl />);

  const autoTheme = view.getByRole("radio", { name: "themeAuto" });
  assert.ok(view.getByRole("radio", { name: "themeLight" }));
  const darkTheme = view.getByRole("radio", { name: "themeDark" });
  assert.ok(view.container.querySelector(".tabler-icon-sun"));
  assert.ok(view.container.querySelector(".tabler-icon-device-desktop"));
  assert.ok(view.container.querySelector(".tabler-icon-moon"));
  fireEvent.click(darkTheme);
  assert.equal(
    componentDocument.documentElement.dataset.mantineColorScheme,
    "dark",
  );
  fireEvent.click(autoTheme);
  assert.equal(
    componentDocument.defaultView?.localStorage.getItem(
      "mantine-color-scheme-value",
    ),
    "auto",
  );
});

test("duplicate layout names disable save-as before submitting", () => {
  let saveCalls = 0;
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[{ name: "existing", builtin: true }]}
      selectedLayout="existing:builtin"
      layoutName="existing"
      currentBuiltin={true}
      isDefaultLayout={false}
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
  fireEvent.click(view.getByRole("button", { name: "saveAs" }));
  const input = view.getByRole("textbox", { name: "layoutName" });
  fireEvent.change(input, { target: { value: "existing" } });

  assert.equal(
    view
      .getByRole("button", { name: "save", exact: true })
      .hasAttribute("disabled"),
    true,
  );
  assert.equal(saveCalls, 0);
});

test("layout panel keeps secondary actions in a more menu", () => {
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[{ name: "custom", builtin: false }]}
      selectedLayout="custom:user"
      layoutName="custom"
      currentBuiltin={false}
      isDefaultLayout={true}
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
  const panel = within(view.container);

  assert.equal(panel.queryByRole("button", { name: "deleteLayout" }), null);
  const setDefaultButton = panel.getByRole("button", {
    name: "defaultLayout",
  });
  assert.equal(setDefaultButton.hasAttribute("disabled"), true);
  const moreButton = panel.getByRole("button", { name: "moreActions" });
  fireEvent.click(moreButton);
  assert.equal(moreButton.getAttribute("aria-expanded"), "true");
  assert.ok(panel.getByRole("menuitem", { name: "export", hidden: true }));
  assert.ok(panel.getByRole("menuitem", { name: "import", hidden: true }));
  assert.ok(
    panel.getByRole("menuitem", { name: "deleteLayout", hidden: true }),
  );
});

test("layout panel confirms a package preview before importing", () => {
  let confirmCalls = 0;
  let cancelCalls = 0;
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[]}
      selectedLayout=""
      layoutName="current"
      currentBuiltin={false}
      isDefaultLayout={false}
      isDirty={false}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => true}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
      pendingImport={{
        name: "sample",
        savedName: "sample-2",
        formatVersion: 2,
        imageCount: 3,
        imageBytes: 2048,
      }}
      confirmImport={() => {
        confirmCalls += 1;
      }}
      cancelImport={() => {
        cancelCalls += 1;
      }}
    />,
  );

  assert.ok(view.getByText("sample"));
  assert.ok(view.getByText("sample-2"));
  assert.ok(view.getByText("2.0 KB"));
  fireEvent.click(view.getByRole("button", { name: "confirmImport" }));
  fireEvent.click(view.getByRole("button", { name: "cancel" }));
  assert.equal(confirmCalls, 1);
  assert.equal(cancelCalls, 1);
});

test("layout panel disables import confirmation and cancellation while importing", () => {
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[]}
      selectedLayout=""
      layoutName="current"
      currentBuiltin={false}
      isDefaultLayout={false}
      isDirty={false}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => true}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
      pendingImport={{
        name: "sample",
        savedName: "sample",
        formatVersion: 2,
        imageCount: 0,
        imageBytes: 0,
      }}
      importInProgress={true}
      confirmImport={() => {}}
      cancelImport={() => {}}
    />,
  );

  const confirm = view.getByRole("button", { name: "confirmImport" });
  const cancel = view.getByRole("button", { name: "cancel" });
  assert.equal(confirm.hasAttribute("disabled"), true);
  assert.equal(cancel.hasAttribute("disabled"), true);
});

test("layout panel warns before an import discards unsaved changes", () => {
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[]}
      selectedLayout=""
      layoutName="current"
      currentBuiltin={false}
      isDefaultLayout={false}
      isDirty={true}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => true}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
      pendingImport={{
        name: "sample",
        savedName: "sample",
        formatVersion: 2,
        imageCount: 0,
        imageBytes: 0,
      }}
      confirmImport={() => {}}
      cancelImport={() => {}}
    />,
  );

  assert.ok(view.getByText("importDiscardWarning"));
  assert.ok(view.getByRole("button", { name: "discardAndImport" }));
});

test("linked size inputs update height and can unlink the ratio", () => {
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
  const width = view.getByRole("textbox", { name: "Width" });
  const height = view.getByRole("textbox", { name: "Height" });
  fireEvent.change(width, { target: { value: "200" } });
  assert.equal((height as HTMLInputElement).value, "100");

  fireEvent.click(view.getByRole("button", { name: "unlinkAspectRatio" }));
  fireEvent.change(width, { target: { value: "300" } });
  assert.equal((height as HTMLInputElement).value, "100");
});

test("background image name is text because file selection owns it", () => {
  const layout = createDefaultLayout();
  layout.background.useCss = false;
  layout.background.image = "background.png";
  const view = renderComponent(
    <BackgroundSettingsPanel
      layout={layout}
      fileInputRef={createRef<HTMLInputElement>()}
      updateLayout={() => {}}
      uploadImage={() => {}}
      openImagePicker={() => {}}
    />,
  );

  assert.equal(view.queryByRole("textbox", { name: "bgImage" }), null);
  assert.ok(view.getByText("background.png"));
  assert.equal(
    view.getByRole("button", { name: "selectFile" }).style.flexShrink,
    "0",
  );
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

test("selection overlays show active snap alignment guides", () => {
  const view = renderComponent(
    <SelectionOverlays
      selectionRect={null}
      selectedGroupRect={null}
      snapGuides={{ x: 120, y: 80 }}
      snapTargets={[{ left: 100, top: 60, right: 140, bottom: 100 }]}
      boundsPadding={0}
      onBoundsMouseDown={() => {}}
      onBoundsClick={() => {}}
    />,
  );

  const vertical = view.container.querySelector<HTMLElement>(
    ".snap-guide-vertical",
  );
  const horizontal = view.container.querySelector<HTMLElement>(
    ".snap-guide-horizontal",
  );
  assert.equal(vertical?.style.left, "120px");
  assert.equal(horizontal?.style.top, "80px");
  const target = view.container.querySelector<HTMLElement>(".snap-target");
  assert.equal(target?.style.left, "100px");
  assert.equal(target?.style.top, "60px");
  assert.equal(target?.style.width, "40px");
  assert.equal(target?.style.height, "40px");
});

test("zoom percentage resets zoom without a separate reset button", () => {
  const changes: number[] = [];
  const snappingChanges: boolean[] = [];
  const view = renderComponent(
    <PreviewZoomControls
      zoomPercent={140}
      canZoomIn={true}
      canZoomOut={true}
      snappingEnabled={true}
      onZoomIn={() => {}}
      onZoomOut={() => {}}
      onReset={() => changes.push(1)}
      onSnappingChange={(enabled) => snappingChanges.push(enabled)}
    />,
  );
  const controls = within(view.container);

  assert.equal(controls.getAllByRole("button").length, 4);
  const snapping = controls.getByRole("button", { name: "snapping" });
  assert.equal(snapping.getAttribute("aria-pressed"), "true");
  fireEvent.click(snapping);
  assert.deepEqual(snappingChanges, [false]);
  fireEvent.click(controls.getByRole("button", { name: "resetZoom" }));
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

test("sidebar keeps fixed content outside the accordion", () => {
  const view = renderComponent(
    <SidebarAccordion
      fixedContent={<p>Always visible</p>}
      sections={[
        { value: "layout", label: "Layout", content: <p>Layout body</p> },
      ]}
    />,
  );

  assert.ok(view.getByText("Always visible"));
  assert.equal(
    view.container.querySelectorAll(".sidebar-accordion button").length,
    1,
  );
});

test("display settings omit preview scale controls", () => {
  const view = renderComponent(
    <DisplaySettingsPanel
      language="en"
      hasGuides={true}
      onLanguageChange={() => {}}
      onClearGuides={() => {}}
    />,
  );

  assert.ok(view.getByRole("combobox", { name: "language" }));
  assert.ok(view.getByRole("button", { name: "clearGuides" }));
  assert.equal(view.queryByRole("slider"), null);
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

  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));

  assert.equal(details.open, true);
});

test("advanced button settings restore their open state after remounting", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
  const first = renderComponent(
    <ButtonAdvancedSettings label="Advanced" storage={storage}>
      <p>Advanced content</p>
    </ButtonAdvancedSettings>,
  );
  const firstDetails = first.container.querySelector("details");
  assert.ok(firstDetails);
  firstDetails.open = true;
  fireEvent(firstDetails, new componentDocument.defaultView.Event("toggle"));
  assert.equal(firstDetails.open, true);
  first.unmount();

  const second = renderComponent(
    <ButtonAdvancedSettings label="Advanced" storage={storage}>
      <p>Advanced content</p>
    </ButtonAdvancedSettings>,
  );
  const secondDetails = second.container.querySelector("details");
  assert.ok(secondDetails);
  assert.equal(secondDetails.open, true);
});
