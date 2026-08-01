// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { componentDocument, renderComponent } from "./component-render";
import { act, fireEvent, within } from "@testing-library/react";
import { createRef, type ComponentProps, useState } from "react";
import { ConfirmationModal } from "../src/components/editor/ConfirmationModal";
import { LayoutSettingsPanel } from "../src/components/editor/LayoutSettingsPanel";
import { DisplaySettingsPanel } from "../src/components/editor/DisplaySettingsPanel";
import { LinkedSizeInputs } from "../src/components/editor/LinkedSizeInputs";
import { PreviewZoomControls } from "../src/components/editor/PreviewZoomControls";
import { SidebarAccordion } from "../src/components/editor/SidebarAccordion";
import { ButtonLayer } from "../src/components/gamepad/ButtonLayer";
import { ButtonAdvancedSettings } from "../src/components/editor/ButtonSettingsSections";
import { ButtonSettingsPanel } from "../src/components/editor/ButtonSettingsPanel";
import { GamepadView } from "../src/components/GamepadView";
import { GamepadBackgroundLayer } from "../src/components/gamepad/GamepadBackgroundLayer";
import { SelectionOverlays } from "../src/components/gamepad/SelectionOverlays";
import { createDefaultLayout } from "../src/layout";
import {
  BackgroundSettingsPanel,
  StickSettingsPanel,
} from "../src/components/editor/SettingsPanels";
import { ThemeControl } from "../src/components/editor/ThemeControl";
import { EditorContextMenu } from "../src/components/editor/EditorContextMenu";
import { DragCoordinateTooltip } from "../src/components/editor/DragCoordinateTooltip";
import { ShortcutCheatSheet } from "../src/components/editor/ShortcutCheatSheet";

test("shortcut cheat sheet lists editor commands for the current platform", () => {
  renderComponent(<ShortcutCheatSheet platform="MacIntel" />);
  fireEvent.click(
    componentDocument.body.querySelector<HTMLButtonElement>(
      '[aria-label="keyboardShortcuts"]',
    ) as HTMLButtonElement,
  );

  const shortcuts = Array.from(
    componentDocument.body.querySelectorAll(".shortcut-cheat-sheet-key"),
    (element) => element.textContent,
  );
  assert.deepEqual(shortcuts, [
    "Cmd+S",
    "Cmd+Z",
    "Cmd+Shift+Z",
    "Cmd+A",
    "Escape",
    "Cmd+D",
    "Delete",
    "R",
    "Arrow keys",
    "Cmd+Wheel",
  ]);
});

test("editor context menu offers deletion and closes after the action", () => {
  let deletes = 0;
  let closes = 0;
  renderComponent(
    <EditorContextMenu
      x={120}
      y={80}
      showButtonActions={true}
      onDuplicate={() => {}}
      onResetToDefault={() => {}}
      onResetRotation={() => {}}
      onDelete={() => {
        deletes += 1;
      }}
      onClose={() => {
        closes += 1;
      }}
    />,
  );

  const menu = componentDocument.body.querySelector<HTMLElement>(
    ".editor-context-menu",
  );
  assert.equal(menu?.style.left, "120px");
  assert.equal(menu?.style.top, "80px");
  const deleteButton = within(menu as HTMLElement).getByRole("menuitem", {
    name: "deleteSelection",
  });
  fireEvent.click(deleteButton);
  assert.equal(deletes, 1);
  assert.equal(closes, 1);
});

test("drag coordinate tooltip renders its label near the given position", () => {
  renderComponent(
    <DragCoordinateTooltip x={140} y={90} label="X: 225, Y: 80" />,
  );

  const tooltip = componentDocument.body.querySelector<HTMLElement>(
    ".drag-coordinate-tooltip",
  );
  assert.equal(tooltip?.style.left, "140px");
  assert.equal(tooltip?.style.top, "90px");
  assert.equal(tooltip?.textContent, "X: 225, Y: 80");
});

test("editor context menu shows button actions only for button selections", () => {
  const view = renderComponent(
    <EditorContextMenu
      x={0}
      y={0}
      showButtonActions={true}
      onDuplicate={() => {}}
      onResetToDefault={() => {}}
      onResetRotation={() => {}}
      onDelete={() => {}}
      onClose={() => {}}
    />,
  );
  assert.equal(
    componentDocument.body.querySelectorAll('[role="menuitem"]').length,
    6,
  );
  view.rerender(
    <EditorContextMenu
      x={0}
      y={0}
      showButtonActions={false}
      onDuplicate={() => {}}
      onResetToDefault={() => {}}
      onResetRotation={() => {}}
      onDelete={() => {}}
      onClose={() => {}}
    />,
  );
  assert.equal(
    componentDocument.body.querySelectorAll('[role="menuitem"]').length,
    1,
  );
});

test("editor context menu shows shortcuts for assigned actions", () => {
  renderComponent(
    <EditorContextMenu
      x={0}
      y={0}
      showButtonActions={true}
      onDuplicate={() => {}}
      onResetToDefault={() => {}}
      onResetRotation={() => {}}
      onDelete={() => {}}
      onClose={() => {}}
    />,
  );

  const shortcuts = Array.from(
    componentDocument.body.querySelectorAll(".editor-context-menu-shortcut"),
    (element) => element.textContent,
  );
  assert.deepEqual(shortcuts, ["Ctrl+D", "R", "Delete"]);
});

test("editor context menu actions do not bubble as preview clicks", () => {
  let bubbledClicks = 0;
  renderComponent(
    <div onClick={() => (bubbledClicks += 1)}>
      <EditorContextMenu
        x={0}
        y={0}
        showButtonActions={true}
        onDuplicate={() => {}}
        onResetToDefault={() => {}}
        onResetRotation={() => {}}
        onDelete={() => {}}
        onClose={() => {}}
      />
    </div>,
  );
  const menu = componentDocument.body.querySelector<HTMLElement>(
    ".editor-context-menu",
  );
  assert.ok(menu);

  fireEvent.click(
    within(menu).getByRole("menuitem", { name: "resetRotation" }),
  );
  assert.equal(bubbledClicks, 0);
});

test("editor context menu requests moving button selections between layers", () => {
  const moves: string[] = [];
  renderComponent(
    <EditorContextMenu
      x={0}
      y={0}
      showButtonActions={true}
      onDuplicate={() => {}}
      onResetToDefault={() => {}}
      onResetRotation={() => {}}
      onBringToFront={() => moves.push("front")}
      onSendToBack={() => moves.push("back")}
      onDelete={() => {}}
      onClose={() => {}}
    />,
  );
  const menu = componentDocument.body.querySelector<HTMLElement>(
    ".editor-context-menu",
  );
  assert.ok(menu);

  fireEvent.click(within(menu).getByRole("menuitem", { name: "bringToFront" }));
  assert.deepEqual(moves, ["front"]);
});

test("editor context menu offers horizontal and vertical distribution", () => {
  const distributions: string[] = [];
  renderComponent(
    <EditorContextMenu
      x={0}
      y={0}
      showButtonActions={true}
      showDistributionActions={true}
      onDuplicate={() => {}}
      onResetToDefault={() => {}}
      onResetRotation={() => {}}
      onDistributeHorizontally={() => distributions.push("horizontal")}
      onDistributeVertically={() => distributions.push("vertical")}
      onDelete={() => {}}
      onClose={() => {}}
    />,
  );
  const menu = componentDocument.body.querySelector<HTMLElement>(
    ".editor-context-menu",
  );
  assert.ok(menu);

  assert.ok(
    within(menu).getByRole("menuitem", { name: "distributeHorizontally" }),
  );
  assert.ok(
    within(menu).getByRole("menuitem", { name: "distributeVertically" }),
  );
  fireEvent.click(
    within(menu).getByRole("menuitem", { name: "distributeHorizontally" }),
  );
  assert.deepEqual(distributions, ["horizontal"]);
});

test("right-clicking an unselected button selects it and opens its delete menu", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 2;
  const selections: unknown[] = [];
  const deletions: unknown[] = [];
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndex={0}
      selectedButtonIndexes={[0]}
      onSelectionChange={(selection) => selections.push(selection)}
      onDeleteSelection={(selection) => deletions.push(selection)}
    />,
  );

  const button = view.container.querySelector("#button1");
  assert.ok(button);
  fireEvent.contextMenu(button, { clientX: 140, clientY: 90 });

  assert.deepEqual(selections.at(-1), {
    buttonIndexes: [1],
    stick: false,
  });
  const menu = componentDocument.body.querySelector<HTMLElement>(
    ".editor-context-menu",
  );
  assert.ok(menu);
  fireEvent.click(
    within(menu).getByRole("menuitem", { name: "deleteSelection" }),
  );
  assert.deepEqual(deletions, [{ buttonIndexes: [1], stick: false }]);
});

test("right-clicking three selected buttons offers distribution", () => {
  const distributions: unknown[] = [];
  const view = renderComponent(
    <GamepadView
      layout={createDefaultLayout()}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndex={0}
      selectedButtonIndexes={[0, 1, 2]}
      onDistributeSelection={(selection, direction) =>
        distributions.push({ selection, direction })
      }
    />,
  );
  const button = view.container.querySelector("#button0");
  assert.ok(button);
  fireEvent.contextMenu(button, { clientX: 140, clientY: 90 });
  const menu = componentDocument.body.querySelector<HTMLElement>(
    ".editor-context-menu",
  );
  assert.ok(menu);

  fireEvent.click(
    within(menu).getByRole("menuitem", { name: "distributeVertically" }),
  );

  assert.deepEqual(distributions, [
    {
      selection: { buttonIndexes: [0, 1, 2], stick: false },
      direction: "vertical",
    },
  ]);
});

test("left-clicking another button closes an open context menu", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 2;
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndex={0}
      selectedButtonIndexes={[0]}
    />,
  );

  const target = view.container.querySelector("#button0");
  assert.ok(target);
  fireEvent.contextMenu(target, { clientX: 140, clientY: 90 });
  assert.equal(
    componentDocument.body.querySelector(".editor-context-menu") === null,
    false,
  );

  const other = view.container.querySelector("#button1");
  assert.ok(other);
  fireEvent.mouseDown(other, { button: 0 });

  assert.equal(
    componentDocument.body.querySelector(".editor-context-menu") === null,
    true,
  );
});

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
      renameLayout={async () => true}
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

test("the rename control is hidden for built-in layouts", () => {
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
      saveLayoutAs={async () => true}
      renameLayout={async () => true}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
    />,
  );

  assert.equal(
    view.queryByRole("button", { name: "renameLayout" }) === null,
    true,
  );
});

test("renaming a layout calls renameLayout with the new name and closes the form", async () => {
  const renameCalls: string[] = [];
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[{ name: "custom", builtin: false }]}
      selectedLayout="custom:user"
      layoutName="custom"
      currentBuiltin={false}
      isDefaultLayout={false}
      isDirty={false}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => true}
      renameLayout={async (name) => {
        renameCalls.push(name);
        return true;
      }}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "renameLayout" }));
  const input = view.getByRole("textbox", { name: "layoutName" });
  fireEvent.change(input, { target: { value: "renamed" } });
  await act(async () => {
    fireEvent.click(view.getByRole("button", { name: "save", exact: true }));
  });

  assert.deepEqual(renameCalls, ["renamed"]);
  assert.equal(
    view.queryByRole("textbox", { name: "layoutName" }) === null,
    true,
  );
});

test("duplicate layout names disable rename before submitting", () => {
  let renameCalls = 0;
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[
        { name: "custom", builtin: false },
        { name: "existing", builtin: false },
      ]}
      selectedLayout="custom:user"
      layoutName="custom"
      currentBuiltin={false}
      isDefaultLayout={false}
      isDirty={false}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => true}
      renameLayout={async () => {
        renameCalls += 1;
        return true;
      }}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: "renameLayout" }));
  const input = view.getByRole("textbox", { name: "layoutName" });
  fireEvent.change(input, { target: { value: "existing" } });

  assert.equal(
    view
      .getByRole("button", { name: "save", exact: true })
      .hasAttribute("disabled"),
    true,
  );
  assert.equal(renameCalls, 0);
});

test("layout save action exposes its shortcut on hover", () => {
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[]}
      selectedLayout="custom:user"
      layoutName="custom"
      currentBuiltin={false}
      isDefaultLayout={false}
      isDirty={true}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => true}
      renameLayout={async () => true}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
    />,
  );

  assert.equal(
    view.getByRole("button", { name: "overwriteSave" }).getAttribute("title"),
    "overwriteSave (Ctrl+S)",
  );
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
      renameLayout={async () => true}
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

test("layout panel shows the current file format version", () => {
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[]}
      selectedLayout="legacy:user"
      layoutName="legacy"
      layoutFormatVersion={1}
      currentBuiltin={false}
      isDefaultLayout={false}
      isDirty={false}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => true}
      renameLayout={async () => true}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
    />,
  );

  assert.ok(view.getByText("v1"));
});

test("layout panel wraps a long layout name within the panel", () => {
  const longName = "very-long-layout-name-without-a-safe-break-point";
  const view = renderComponent(
    <LayoutSettingsPanel
      layoutNames={[]}
      selectedLayout=""
      layoutName={longName}
      currentBuiltin={false}
      isDefaultLayout={false}
      isDirty={false}
      status={null}
      openLayout={() => {}}
      saveLayout={() => {}}
      saveLayoutAs={async () => true}
      renameLayout={async () => true}
      deleteLayout={() => {}}
      setDefaultLayout={() => {}}
      exportLayout={() => {}}
      importLayout={() => {}}
    />,
  );

  assert.equal(view.getByText(longName).style.overflowWrap, "anywhere");
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
      renameLayout={async () => true}
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
      renameLayout={async () => true}
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
      renameLayout={async () => true}
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

test("background image settings allow changing the border radius", () => {
  const layout = createDefaultLayout();
  layout.background.useCss = false;
  layout.background.image = "background.png";
  layout.background.cssBorderRadius = 12;
  let updatedRadius: number | undefined;

  const view = renderComponent(
    <BackgroundSettingsPanel
      layout={layout}
      fileInputRef={createRef<HTMLInputElement>()}
      updateLayout={(update) => {
        const next = structuredClone(layout);
        update(next);
        updatedRadius = next.background.cssBorderRadius;
      }}
      uploadImage={() => {}}
      openImagePicker={() => {}}
    />,
  );

  const radiusInput = view.getByRole("textbox", { name: "borderRadius" });
  assert.equal((radiusInput as HTMLInputElement).value, "12");
  fireEvent.change(radiusInput, { target: { value: "24" } });
  assert.equal(updatedRadius, 24);
});

test("background image layer applies the configured border radius", () => {
  const background = createDefaultLayout().background;
  background.useCss = false;
  background.image = "background.png";
  background.cssBorderRadius = 18;

  const view = renderComponent(
    <GamepadBackgroundLayer
      background={background}
      layoutName="sample"
      width={500}
      height={250}
      opacity={1}
    />,
  );

  const layer = view.container.querySelector<HTMLElement>(
    "#gamepad-area-background",
  );
  assert.equal(
    layer?.style.backgroundImage,
    'url("layout/sample/background.png")',
  );
  assert.equal(layer?.style.borderRadius, "18px");
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

test("button layer renders pill buttons with fully rounded ends", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  Object.assign(layout.defaultbuttons, { cssShape: "pill" });
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[]}
      editorMode={false}
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  const button = view.container.querySelector<HTMLElement>("#button0");
  assert.equal(button?.style.getPropertyValue("--button-radius"), "9999px");
});

test("pressed buttons keep their released size", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.defaultbuttons.w = "48";
  layout.defaultbuttons.h = "40";
  layout.defaultbuttons.wp = "72";
  layout.defaultbuttons.hp = "60";
  layout.buttons[0].w = "52";
  layout.buttons[0].h = "44";
  layout.buttons[0].wp = "80";
  layout.buttons[0].hp = "70";
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[true]}
      editorMode={false}
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  const button = view.container.querySelector<HTMLElement>("#button0");
  assert.equal(button?.style.width, "52px");
  assert.equal(button?.style.height, "44px");
});

test("a button with text renders a label inside it", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0].text = "P1";
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[]}
      editorMode={false}
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  const label = view.container.querySelector("#button0 .gamepad-button-label");
  assert.equal(label?.textContent, "P1");
});

test("a button without text renders no label", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[]}
      editorMode={false}
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  assert.equal(
    view.container.querySelector("#button0 .gamepad-button-label") === null,
    true,
  );
});

test("button text color and size fall back to the defaults, then to a button's own values", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 2;
  layout.defaultbuttons.cssTextColor = "#111111";
  layout.defaultbuttons.cssTextSize = "20";
  layout.buttons[0].text = "P1";
  layout.buttons[1].text = "P2";
  layout.buttons[1].cssTextColor = "#eeeeee";
  layout.buttons[1].cssTextSize = "32";
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[]}
      editorMode={false}
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  const inherited = view.container.querySelector<HTMLElement>("#button0");
  assert.equal(
    inherited?.style.getPropertyValue("--button-text-color"),
    "#111111",
  );
  assert.equal(inherited?.style.getPropertyValue("--button-text-size"), "20px");

  const overridden = view.container.querySelector<HTMLElement>("#button1");
  assert.equal(
    overridden?.style.getPropertyValue("--button-text-color"),
    "#eeeeee",
  );
  assert.equal(
    overridden?.style.getPropertyValue("--button-text-size"),
    "32px",
  );
});

test("button text renders bold, italic, and outline styling", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0].text = "P1";
  layout.buttons[0].cssTextBold = true;
  layout.buttons[0].cssTextItalic = true;
  layout.buttons[0].cssTextOutline = true;
  layout.buttons[0].cssTextOutlineColor = "#00ff00";
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[]}
      editorMode={false}
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  const button = view.container.querySelector<HTMLElement>("#button0");
  assert.equal(button?.style.getPropertyValue("--button-text-weight"), "bold");
  assert.equal(button?.style.getPropertyValue("--button-text-style"), "italic");
  assert.equal(
    button?.style.getPropertyValue("--button-text-stroke-color"),
    "#00ff00",
  );
  assert.notEqual(
    button?.style.getPropertyValue("--button-text-stroke-width"),
    "0px",
  );
});

test("button text has no outline stroke width by default", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0].text = "P1";
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[]}
      editorMode={false}
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  const button = view.container.querySelector<HTMLElement>("#button0");
  assert.equal(
    button?.style.getPropertyValue("--button-text-weight"),
    "normal",
  );
  assert.equal(button?.style.getPropertyValue("--button-text-style"), "normal");
  assert.equal(
    button?.style.getPropertyValue("--button-text-stroke-width"),
    "0px",
  );
});

test("a button without outline does not get the outline label class, so color emoji still render", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0].text = "😢";
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[]}
      editorMode={false}
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  const label = view.container.querySelector(".gamepad-button-label");
  assert.equal(
    label?.classList.contains("gamepad-button-label-outline"),
    false,
  );
});

test("a button with outline enabled gets the outline label class", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0].text = "P1";
  layout.buttons[0].cssTextOutline = true;
  const view = renderComponent(
    <ButtonLayer
      layout={layout}
      pressedButtons={[]}
      editorMode={false}
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      onButtonClick={() => {}}
      onButtonMouseDown={() => {}}
    />,
  );

  const label = view.container.querySelector(".gamepad-button-label");
  assert.equal(label?.classList.contains("gamepad-button-label-outline"), true);
});

test("control-clicking the stick center requests selection toggle", () => {
  const layout = createDefaultLayout();
  const clicks: Array<{ index: number | null; toggle: boolean }> = [];
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

  assert.deepEqual(clicks, [{ index: null, toggle: true }]);
});

test("clicking the stick center selects it without starting an assignment", () => {
  const layout = createDefaultLayout();
  const clicks: Array<{ index: number | null; toggle: boolean }> = [];
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
  fireEvent.click(handle);

  assert.deepEqual(clicks, [{ index: null, toggle: false }]);
});

test("clicking a stick direction zone selects the stick and requests its assignment", () => {
  const layout = createDefaultLayout();
  const clicks: Array<{ index: number | null; toggle: boolean }> = [];
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedStick={true}
      onStickClick={(index, toggle) => clicks.push({ index, toggle })}
    />,
  );

  assert.equal(
    view.container.querySelectorAll(".tabler-icon-arrow-big-up-filled").length,
    4,
  );
  const upZone = view.container.querySelector("#stick-up");
  assert.ok(upZone);
  fireEvent.click(upZone);

  assert.deepEqual(clicks, [{ index: 0, toggle: false }]);
});

test("stick direction zones render outside #stick-area, not shadowed by its stacking context", () => {
  // #stick-area gets a transform (for centering/scaling), which forces a
  // new stacking context; a high z-index on a descendant can never outrank
  // .selection-bounds (a sibling of #stick-area) from inside that context.
  // The zones must be true siblings of .selection-bounds for their z-index
  // to actually apply.
  const layout = createDefaultLayout();
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedStick={true}
      onStickClick={() => {}}
    />,
  );

  const stickArea = view.container.querySelector("#stick-area");
  const upZone = view.container.querySelector("#stick-up");
  assert.ok(stickArea);
  assert.ok(upZone);
  assert.equal(stickArea.contains(upZone), false);
});

test("stick direction zones do not exist until the stick is selected", () => {
  const layout = createDefaultLayout();
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedStick={false}
      onStickClick={() => {}}
    />,
  );

  assert.equal(
    view.container.querySelectorAll(".tabler-icon-arrow-big-up-filled").length,
    0,
  );
  assert.equal(view.container.querySelector("#stick-up") === null, true);
});

test("stick direction zones do not exist outside editor mode", () => {
  const layout = createDefaultLayout();
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={false}
      selectedStick={true}
      onStickClick={() => {}}
    />,
  );

  assert.equal(view.container.querySelector("#stick-up") === null, true);
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

test("selection overlays show four resize handles only for a resizable selection", () => {
  const view = renderComponent(
    <SelectionOverlays
      selectionRect={null}
      selectedGroupRect={{ left: 10, top: 20, right: 70, bottom: 60 }}
      resizable={true}
      boundsPadding={0}
      onBoundsMouseDown={() => {}}
      onBoundsClick={() => {}}
      onResizeMouseDown={() => {}}
    />,
  );

  assert.equal(view.container.querySelectorAll(".resize-handle").length, 4);
  view.rerender(
    <SelectionOverlays
      selectionRect={null}
      selectedGroupRect={{ left: 10, top: 20, right: 70, bottom: 60 }}
      resizable={false}
      boundsPadding={0}
      onBoundsMouseDown={() => {}}
      onBoundsClick={() => {}}
      onResizeMouseDown={() => {}}
    />,
  );
  assert.equal(view.container.querySelectorAll(".resize-handle").length, 0);
});

test("selection overlays show a rotation handle only for a rotatable selection", () => {
  const view = renderComponent(
    <SelectionOverlays
      selectionRect={null}
      selectedGroupRect={{ left: 10, top: 20, right: 70, bottom: 60 }}
      rotatable={true}
      boundsPadding={0}
      onBoundsMouseDown={() => {}}
      onBoundsClick={() => {}}
      onRotateMouseDown={() => {}}
    />,
  );

  assert.ok(view.container.querySelector(".rotation-handle"));
  assert.ok(view.container.querySelector(".rotation-handle svg"));
  view.rerender(
    <SelectionOverlays
      selectionRect={null}
      selectedGroupRect={{ left: 10, top: 20, right: 70, bottom: 60 }}
      rotatable={false}
      boundsPadding={0}
      onBoundsMouseDown={() => {}}
      onBoundsClick={() => {}}
      onRotateMouseDown={() => {}}
    />,
  );
  assert.equal(view.container.querySelector(".rotation-handle"), null);
});

test("selection overlay rotates its bounds and handles with the selected button", () => {
  const view = renderComponent(
    <SelectionOverlays
      selectionRect={null}
      selectedGroupRect={{ left: 10, top: 20, right: 70, bottom: 60 }}
      rotatable={true}
      rotation={45}
      boundsPadding={0}
      onBoundsMouseDown={() => {}}
      onBoundsClick={() => {}}
      onRotateMouseDown={() => {}}
    />,
  );

  const bounds = view.container.querySelector<HTMLElement>(".selection-bounds");
  assert.equal(bounds?.style.transform, "rotate(45deg)");
});

test("dragging a selected button corner reports its resized bounds", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0] = {
    ...layout.buttons[0],
    x: "100",
    y: "80",
    w: "60",
    h: "40",
  };
  const changes: unknown[] = [];
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndex={0}
      selectedButtonIndexes={[0]}
      aspectRatioLocked={false}
      onSizeChange={(change) => changes.push(change)}
    />,
  );

  const handle = view.container.querySelector(".resize-handle-se");
  assert.ok(handle);
  fireEvent.mouseDown(handle, { button: 0, clientX: 130, clientY: 100 });
  fireEvent.mouseMove(document, { clientX: 150, clientY: 110 });
  fireEvent.mouseUp(document);

  assert.deepEqual(changes.at(-1), {
    type: "button",
    index: 0,
    x: 110,
    y: 85,
    width: 80,
    height: 50,
  });
});

test("dragging a button reports its live coordinate near the cursor", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0] = { ...layout.buttons[0], x: "100", y: "80" };
  const coordinates: Array<{ x: number; y: number; label: string } | null> = [];
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndex={0}
      selectedButtonIndexes={[0]}
      snappingEnabled={false}
      onDragCoordinateChange={(coordinate) => coordinates.push(coordinate)}
    />,
  );

  const button = view.container.querySelector("#button0");
  assert.ok(button);
  fireEvent.mouseDown(button, { button: 0, clientX: 100, clientY: 80 });
  fireEvent.mouseMove(document, { clientX: 115, clientY: 95 });
  fireEvent.mouseUp(document);

  assert.deepEqual(coordinates.at(-2), {
    x: 115,
    y: 95,
    label: "X: 115, Y: 95",
  });
  assert.equal(coordinates.at(-1), null);
});

test("dragging multiple selected buttons reports the movement delta", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 2;
  layout.buttons[0] = { ...layout.buttons[0], x: "100", y: "80" };
  layout.buttons[1] = { ...layout.buttons[1], x: "200", y: "80" };
  const coordinates: Array<{ x: number; y: number; label: string } | null> = [];
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndexes={[0, 1]}
      snappingEnabled={false}
      onDragCoordinateChange={(coordinate) => coordinates.push(coordinate)}
    />,
  );

  const bounds = view.container.querySelector(".selection-bounds");
  assert.ok(bounds);
  fireEvent.mouseDown(bounds, { button: 0, clientX: 100, clientY: 80 });
  fireEvent.mouseMove(document, { clientX: 115, clientY: 95 });
  fireEvent.mouseUp(document);

  assert.deepEqual(coordinates.at(-2), {
    x: 115,
    y: 95,
    label: "ΔX: +15, ΔY: +15",
  });
  assert.equal(coordinates.at(-1), null);
});

test("dragging a selected button corner follows the linked aspect ratio", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0] = {
    ...layout.buttons[0],
    x: "100",
    y: "80",
    w: "60",
    h: "40",
  };
  const changes: Array<{ width: number; height: number }> = [];
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndex={0}
      selectedButtonIndexes={[0]}
      aspectRatioLocked={true}
      onSizeChange={({ width, height }) => changes.push({ width, height })}
    />,
  );

  const handle = view.container.querySelector(".resize-handle-se");
  assert.ok(handle);
  fireEvent.mouseDown(handle, { button: 0, clientX: 130, clientY: 100 });
  fireEvent.mouseMove(document, { clientX: 160, clientY: 105 });
  fireEvent.mouseUp(document);

  assert.deepEqual(changes.at(-1), { width: 90, height: 60 });
});

test("dragging a selected button rotation handle reports the new angle", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0] = {
    ...layout.buttons[0],
    x: "100",
    y: "80",
    w: "60",
    h: "40",
    rotation: "30",
  };
  const changes: Array<{ index: number; rotation: number }> = [];
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndex={0}
      selectedButtonIndexes={[0]}
      onRotationChange={(change) => changes.push(change)}
    />,
  );

  const handle = view.container.querySelector(".rotation-handle");
  assert.ok(handle);
  fireEvent.mouseDown(handle, { button: 0, clientX: 100, clientY: 20 });
  fireEvent.mouseMove(document, { clientX: 160, clientY: 80 });
  fireEvent.mouseUp(document);

  assert.deepEqual(changes.at(-1), { index: 0, rotation: 120 });
});

test("dragging a rotated button corner resizes along its local axes", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 1;
  layout.buttons[0] = {
    ...layout.buttons[0],
    x: "100",
    y: "80",
    w: "60",
    h: "40",
    rotation: "90",
  };
  const changes: unknown[] = [];
  const view = renderComponent(
    <GamepadView
      layout={layout}
      stickClass="stick"
      pressedButtons={[]}
      editorMode={true}
      selectedButtonIndex={0}
      selectedButtonIndexes={[0]}
      aspectRatioLocked={false}
      onSizeChange={(change) => changes.push(change)}
    />,
  );

  const handle = view.container.querySelector(".resize-handle-se");
  assert.ok(handle);
  fireEvent.mouseDown(handle, { button: 0, clientX: 120, clientY: 110 });
  fireEvent.mouseMove(document, { clientX: 120, clientY: 130 });
  fireEvent.mouseUp(document);

  assert.deepEqual(changes.at(-1), {
    type: "button",
    index: 0,
    x: 100,
    y: 90,
    width: 80,
    height: 40,
  });
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
  assert.ok(snapping.classList.contains("preview-snapping-button"));
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

test("sidebar accordion opens a section requested by preview selection", (t) => {
  const testWindow = componentDocument.defaultView;
  assert.ok(testWindow);
  const originalRequestAnimationFrame = testWindow.requestAnimationFrame;
  testWindow.requestAnimationFrame = () => 1;
  t.after(() => {
    testWindow.requestAnimationFrame = originalRequestAnimationFrame;
  });

  function Example() {
    const [revealSection, setRevealSection] = useState<string>();
    return (
      <>
        <button type="button" onClick={() => setRevealSection("buttons")}>
          Select button
        </button>
        <SidebarAccordion
          revealSection={revealSection}
          storage={{ getItem: () => null, setItem: () => {} }}
          sections={[
            {
              value: "buttons",
              label: "Buttons",
              content: <p>Button settings</p>,
            },
          ]}
        />
      </>
    );
  }

  const view = renderComponent(<Example />);
  const buttonSection = view.getByRole("button", { name: "Buttons" });
  assert.equal(buttonSection.getAttribute("aria-expanded"), "false");

  fireEvent.click(view.getByRole("button", { name: "Select button" }));

  assert.equal(buttonSection.getAttribute("aria-expanded"), "true");
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

test("button settings default to the selected-button tab once a button is selected", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 2;
  const view = renderComponent(
    <ButtonSettingsPanel
      layout={layout}
      assigningTarget={null}
      assignmentName=""
      selectedButtonIndex={1}
      selectedButtonIndexes={[1]}
      updateLayout={() => {}}
      updateSelectedButtons={() => {}}
      onSelectedButtonChange={() => {}}
      onAddButton={() => {}}
      onDeleteSelectedButtons={() => {}}
      openImagePicker={() => {}}
      cancelAssignment={() => {}}
    />,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));

  assert.ok(view.getByRole("heading", { name: "selectedButtonSettings" }));
  assert.ok(view.container.querySelector(".button-settings-card-selected"));
  assert.equal(
    view.queryByRole("heading", { name: "defaultButtonSettings" }) === null,
    true,
  );

  fireEvent.click(view.getByRole("tab", { name: "defaultButtonSettings" }));

  assert.ok(view.getByRole("heading", { name: "defaultButtonSettings" }));
  assert.ok(view.getByText("defaultButtonSettingsHint"));
  assert.ok(view.container.querySelector(".button-settings-card-default"));
  assert.equal(
    view.queryByRole("heading", { name: "selectedButtonSettings" }) === null,
    true,
  );
});

test("resetting all buttons to default lives in the default settings tab", () => {
  const layout = createDefaultLayout();
  layout.totalbuttonshow = 2;
  const view = renderComponent(
    <ButtonSettingsPanel
      layout={layout}
      assigningTarget={null}
      assignmentName=""
      selectedButtonIndex={0}
      selectedButtonIndexes={[0]}
      updateLayout={() => {}}
      updateSelectedButtons={() => {}}
      onSelectedButtonChange={() => {}}
      onAddButton={() => {}}
      onDeleteSelectedButtons={() => {}}
      openImagePicker={() => {}}
      cancelAssignment={() => {}}
    />,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));

  assert.equal(
    view.queryByRole("button", { name: "resetAllToDefault" }) === null,
    true,
  );

  fireEvent.click(view.getByRole("tab", { name: "defaultButtonSettings" }));

  assert.ok(view.getByRole("button", { name: "resetAllToDefault" }));
});

test("default text styling controls update the layout defaults", () => {
  const layout = createDefaultLayout();
  let updatedLayout: typeof layout | undefined;
  const view = renderComponent(
    <ButtonSettingsPanel
      layout={layout}
      assigningTarget={null}
      assignmentName=""
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      updateLayout={(update) => {
        const next = structuredClone(layout);
        update(next);
        updatedLayout = next;
      }}
      updateSelectedButtons={() => {}}
      onSelectedButtonChange={() => {}}
      onAddButton={() => {}}
      onDeleteSelectedButtons={() => {}}
      openImagePicker={() => {}}
      cancelAssignment={() => {}}
    />,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));

  fireEvent.click(view.getByRole("switch", { name: "textBold" }));
  assert.equal(updatedLayout?.defaultbuttons.cssTextBold, true);

  fireEvent.click(view.getByRole("switch", { name: "textItalic" }));
  assert.equal(updatedLayout?.defaultbuttons.cssTextItalic, true);

  assert.equal(view.queryByLabelText("textOutlineColor") === null, true);

  fireEvent.click(view.getByRole("switch", { name: "textOutline" }));
  assert.equal(updatedLayout?.defaultbuttons.cssTextOutline, true);
});

test("single-button settings show and update its coordinates", () => {
  const layout = createDefaultLayout();
  let updatedLayout: typeof layout | undefined;
  const view = renderComponent(
    <ButtonSettingsPanel
      layout={layout}
      assigningTarget={null}
      assignmentName=""
      selectedButtonIndex={1}
      selectedButtonIndexes={[1]}
      updateLayout={(update) => {
        const next = structuredClone(layout);
        update(next);
        updatedLayout = next;
      }}
      updateSelectedButtons={() => {}}
      onSelectedButtonChange={() => {}}
      onAddButton={() => {}}
      onDeleteSelectedButtons={() => {}}
      openImagePicker={() => {}}
      cancelAssignment={() => {}}
    />,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));
  const selectedSettings = view.container.querySelector<HTMLElement>(
    ".button-settings-card-selected",
  );
  assert.ok(selectedSettings);
  const xInput = within(selectedSettings).getByRole("textbox", {
    name: "X (px)",
  });
  const yInput = within(selectedSettings).getByRole("textbox", {
    name: "Y (px)",
  });

  assert.equal((xInput as HTMLInputElement).value, "280");
  assert.equal((yInput as HTMLInputElement).value, "68");

  fireEvent.keyDown(xInput, { key: "ArrowUp" });

  assert.equal(updatedLayout?.buttons[1].x, "281");
  assert.equal(updatedLayout?.buttons[0].x, "225");
});

test("multiple-button settings omit ambiguous coordinates", () => {
  const view = renderComponent(
    <ButtonSettingsPanel
      layout={createDefaultLayout()}
      assigningTarget={null}
      assignmentName=""
      selectedButtonIndex={1}
      selectedButtonIndexes={[0, 1]}
      updateLayout={() => {}}
      updateSelectedButtons={() => {}}
      onSelectedButtonChange={() => {}}
      onAddButton={() => {}}
      onDeleteSelectedButtons={() => {}}
      openImagePicker={() => {}}
      cancelAssignment={() => {}}
    />,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));
  const selectedSettings = view.container.querySelector<HTMLElement>(
    ".button-settings-card-selected",
  );
  assert.ok(selectedSettings);

  assert.equal(
    within(selectedSettings).queryByRole("textbox", { name: "X (px)" }) ===
      null,
    true,
  );
  assert.equal(
    within(selectedSettings).queryByRole("textbox", { name: "Y (px)" }) ===
      null,
    true,
  );
});

function renderSelectedButtonSettings(
  layout: ReturnType<typeof createDefaultLayout>,
  updateSelectedButtons: ComponentProps<
    typeof ButtonSettingsPanel
  >["updateSelectedButtons"] = () => {},
) {
  const view = renderComponent(
    <ButtonSettingsPanel
      layout={layout}
      assigningTarget={null}
      assignmentName=""
      selectedButtonIndex={0}
      selectedButtonIndexes={[0]}
      updateLayout={() => {}}
      updateSelectedButtons={updateSelectedButtons}
      onSelectedButtonChange={() => {}}
      onAddButton={() => {}}
      onDeleteSelectedButtons={() => {}}
      openImagePicker={() => {}}
      cancelAssignment={() => {}}
    />,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));
  const selectedSettings = view.container.querySelector<HTMLElement>(
    ".button-settings-card-selected",
  );
  assert.ok(selectedSettings);
  return { selectedSettings, view };
}

test("button settings omit pressed size controls", () => {
  const { view } = renderSelectedButtonSettings(createDefaultLayout());

  assert.equal(view.queryByRole("textbox", { name: "pressedWidth" }), null);
  assert.equal(view.queryByRole("textbox", { name: "pressedHeight" }), null);
  assert.equal(view.queryByText("pressedSize"), null);
});

test("editing the selected button's text label updates it", () => {
  const layout = createDefaultLayout();
  layout.buttons[0].text = "P1";
  let updatedLayout: typeof layout | undefined;
  const { selectedSettings } = renderSelectedButtonSettings(
    layout,
    (update) => {
      const next = structuredClone(layout);
      update(next);
      updatedLayout = next;
    },
  );

  const textInput = within(selectedSettings).getByRole("textbox", {
    name: "buttonText",
  }) as HTMLInputElement;
  assert.equal(textInput.value, "P1");

  fireEvent.change(textInput, { target: { value: "P2" } });

  assert.equal(updatedLayout?.buttons[0].text, "P2");
});

test("toggling bold and italic switches updates the selected button", () => {
  const layout = createDefaultLayout();
  let updatedLayout: typeof layout | undefined;
  const { selectedSettings } = renderSelectedButtonSettings(
    layout,
    (update) => {
      const next = structuredClone(layout);
      update(next);
      updatedLayout = next;
    },
  );

  fireEvent.click(
    within(selectedSettings).getByRole("switch", {
      name: "textBold inheritDefault",
    }),
  );
  assert.equal(updatedLayout?.buttons[0].cssTextBold, true);

  fireEvent.click(
    within(selectedSettings).getByRole("switch", {
      name: "textItalic inheritDefault",
    }),
  );
  assert.equal(updatedLayout?.buttons[0].cssTextItalic, true);
});

test("enabling the outline switch reveals an outline color picker", () => {
  const layout = createDefaultLayout();
  let updatedLayout: typeof layout | undefined;
  const { selectedSettings } = renderSelectedButtonSettings(
    layout,
    (update) => {
      const next = structuredClone(layout);
      update(next);
      updatedLayout = next;
    },
  );

  assert.equal(
    within(selectedSettings).queryByLabelText("textOutlineColor") === null,
    true,
  );

  fireEvent.click(
    within(selectedSettings).getByRole("switch", {
      name: "textOutline inheritDefault",
    }),
  );
  assert.equal(updatedLayout?.buttons[0].cssTextOutline, true);
});

test("inherited per-button size fields show their effective default values", () => {
  const layout = createDefaultLayout();
  layout.defaultbuttons.w = "48";
  layout.defaultbuttons.h = "48";
  layout.buttons[0].w = "";
  layout.buttons[0].h = "";
  const { selectedSettings } = renderSelectedButtonSettings(layout);

  assert.equal(
    (
      within(selectedSettings).getByRole("textbox", {
        name: "width",
        description: "inheritDefault",
      }) as HTMLInputElement
    ).value,
    "48",
  );
  assert.equal(
    (
      within(selectedSettings).getByRole("textbox", {
        name: "height",
        description: "inheritDefault",
      }) as HTMLInputElement
    ).value,
    "48",
  );
  assert.equal(layout.buttons[0].w, "");
  assert.equal(layout.buttons[0].h, "");
});

test("incrementing an inherited per-button size starts from the effective default", () => {
  const layout = createDefaultLayout();
  layout.defaultbuttons.w = "48";
  layout.defaultbuttons.h = "48";
  layout.buttons[0].w = "";
  layout.buttons[0].h = "";
  let updatedLayout: typeof layout | undefined;
  const { selectedSettings } = renderSelectedButtonSettings(
    layout,
    (update) => {
      const next = structuredClone(layout);
      update(next);
      updatedLayout = next;
    },
  );
  const widthInput = within(selectedSettings).getByRole("textbox", {
    name: "width",
  });

  fireEvent.keyDown(widthInput, { key: "ArrowUp" });

  assert.equal(updatedLayout?.buttons[0].w, "49");
  assert.equal(updatedLayout?.buttons[0].h, "49");
});

test("inherited per-button number fields show their effective default values", () => {
  const layout = createDefaultLayout();
  layout.defaultbuttons.useCss = true;
  layout.defaultbuttons.cssTransition = "0.12";
  layout.defaultbuttons.rotation = "48";
  delete layout.buttons[0].useCss;
  delete layout.buttons[0].cssTransition;
  delete layout.buttons[0].rotation;
  const { selectedSettings } = renderSelectedButtonSettings(layout);

  assert.equal(
    (
      within(selectedSettings).getByRole("textbox", {
        name: "transition",
        description: "inheritDefault",
      }) as HTMLInputElement
    ).value,
    "0.12",
  );
  assert.equal(
    (
      within(selectedSettings).getByRole("textbox", {
        name: "rotation",
        description: "inheritDefault",
      }) as HTMLInputElement
    ).value,
    "48",
  );
});

test("incrementing inherited per-button number fields starts from each effective default", () => {
  const layout = createDefaultLayout();
  layout.defaultbuttons.useCss = true;
  layout.defaultbuttons.cssTransition = "0.12";
  layout.defaultbuttons.rotation = "48";
  delete layout.buttons[0].useCss;
  delete layout.buttons[0].cssTransition;
  delete layout.buttons[0].rotation;
  const updates: Array<typeof layout> = [];
  const { selectedSettings } = renderSelectedButtonSettings(
    layout,
    (update) => {
      const next = structuredClone(layout);
      update(next);
      updates.push(next);
    },
  );

  fireEvent.keyDown(
    within(selectedSettings).getByRole("textbox", { name: "transition" }),
    { key: "ArrowUp" },
  );
  fireEvent.keyDown(
    within(selectedSettings).getByRole("textbox", { name: "rotation" }),
    { key: "ArrowUp" },
  );

  assert.equal(updates[0]?.buttons[0].cssTransition, "0.13");
  assert.equal(updates[1]?.buttons[0].rotation, "49");
});

test("inherited per-button choice fields select their effective default values", () => {
  const layout = createDefaultLayout();
  layout.defaultbuttons.useCss = true;
  layout.defaultbuttons.cssShape = "rounded";
  layout.defaultbuttons.cssEasing = "linear";
  delete layout.buttons[0].useCss;
  delete layout.buttons[0].cssShape;
  delete layout.buttons[0].cssEasing;
  const { selectedSettings } = renderSelectedButtonSettings(layout);

  assert.equal(
    (
      within(selectedSettings).getByRole("combobox", {
        name: "buttonShape",
        description: "inheritDefault",
      }) as HTMLSelectElement
    ).value,
    "rounded",
  );
  assert.equal(
    (
      within(selectedSettings).getByRole("combobox", {
        name: "easing",
        description: "inheritDefault",
      }) as HTMLSelectElement
    ).value,
    "linear",
  );
});

test("default and per-button shape controls offer the pill shape", () => {
  const layout = createDefaultLayout();
  layout.defaultbuttons.useCss = true;
  delete layout.buttons[0].useCss;
  const { view } = renderSelectedButtonSettings(layout);

  assert.equal(view.getAllByRole("option", { name: "shapePill" }).length, 1);

  fireEvent.click(view.getByRole("tab", { name: "defaultButtonSettings" }));

  assert.equal(view.getAllByRole("option", { name: "shapePill" }).length, 1);
});

test("inherited per-button image fields show their effective default values", () => {
  const layout = createDefaultLayout();
  layout.defaultbuttons.useCss = false;
  layout.defaultbuttons.img = "released-default.png";
  layout.defaultbuttons.imgp = "pressed-default.png";
  delete layout.buttons[0].useCss;
  delete layout.buttons[0].img;
  delete layout.buttons[0].imgp;
  const { selectedSettings } = renderSelectedButtonSettings(layout);

  assert.equal(
    (
      within(selectedSettings).getByRole("textbox", {
        name: "releasedImage",
        description: "inheritDefault",
      }) as HTMLInputElement
    ).value,
    "released-default.png",
  );
  assert.equal(
    (
      within(selectedSettings).getByRole("textbox", {
        name: "pressedImage",
        description: "inheritDefault",
      }) as HTMLInputElement
    ).value,
    "pressed-default.png",
  );
});

test("inherited per-button color and mode controls show their effective defaults", () => {
  const layout = createDefaultLayout();
  layout.defaultbuttons.useCss = true;
  layout.defaultbuttons.cssColor = "#123456";
  layout.defaultbuttons.cssPressedColor = "#654321";
  delete layout.buttons[0].useCss;
  delete layout.buttons[0].cssColor;
  delete layout.buttons[0].cssPressedColor;
  const { selectedSettings } = renderSelectedButtonSettings(layout);

  const mode = within(selectedSettings).getByRole("switch", {
    name: "useCssButton inheritDefault",
    description: "inheritDefault",
  });
  assert.equal((mode as HTMLInputElement).checked, false);

  for (const [name, value] of [
    ["colorNormal", "#123456"],
    ["colorPressed", "#654321"],
  ]) {
    const input = within(selectedSettings).getByLabelText(name);
    assert.equal((input as HTMLInputElement).value, value);
    const descriptionId = input.getAttribute("aria-describedby");
    assert.ok(descriptionId);
    const description = componentDocument.getElementById(descriptionId);
    assert.equal(description?.textContent, "inheritDefault");
    assert.equal(description?.style.color, "var(--mantine-color-dimmed)");
  }
});

test("button settings explain how to open per-button settings when unselected", () => {
  const view = renderComponent(
    <ButtonSettingsPanel
      layout={createDefaultLayout()}
      assigningTarget={null}
      assignmentName=""
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      updateLayout={() => {}}
      updateSelectedButtons={() => {}}
      onSelectedButtonChange={() => {}}
      onAddButton={() => {}}
      onDeleteSelectedButtons={() => {}}
      openImagePicker={() => {}}
      cancelAssignment={() => {}}
    />,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));

  fireEvent.click(
    view.getByRole("tab", { name: "selectedButtonSettingsEmpty" }),
  );

  assert.ok(view.getByText("selectButtonForSettings"));
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

test("button settings show the assigning status only for a button target", () => {
  const view = renderComponent(
    <ButtonSettingsPanel
      layout={createDefaultLayout()}
      assigningTarget={0}
      assignmentName="Button 1"
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      updateLayout={() => {}}
      updateSelectedButtons={() => {}}
      onSelectedButtonChange={() => {}}
      onAddButton={() => {}}
      onDeleteSelectedButtons={() => {}}
      openImagePicker={() => {}}
      cancelAssignment={() => {}}
    />,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));

  assert.ok(view.getByText("Button 1"));
});

test("button settings omit the assigning status for a stick target", () => {
  const view = renderComponent(
    <ButtonSettingsPanel
      layout={createDefaultLayout()}
      assigningTarget={1000}
      assignmentName="Stick Up"
      selectedButtonIndex={null}
      selectedButtonIndexes={[]}
      updateLayout={() => {}}
      updateSelectedButtons={() => {}}
      onSelectedButtonChange={() => {}}
      onAddButton={() => {}}
      onDeleteSelectedButtons={() => {}}
      openImagePicker={() => {}}
      cancelAssignment={() => {}}
    />,
  );
  const details = view.container.querySelector("details");
  assert.ok(details);
  details.open = true;
  fireEvent(details, new componentDocument.defaultView.Event("toggle"));

  assert.equal(view.queryByText("Stick Up") === null, true);
});

test("stick settings show the assigning status only for a stick target", () => {
  const cancels: number[] = [];
  const view = renderComponent(
    <StickSettingsPanel
      layout={createDefaultLayout()}
      updateLayout={() => {}}
      assigningTarget={1000}
      assignmentName="Stick Up"
      cancelAssignment={() => cancels.push(1)}
    />,
  );

  assert.ok(view.getByText("Stick Up"));
  fireEvent.click(view.getByRole("button", { name: "cancel" }));
  assert.deepEqual(cancels, [1]);
});

test("stick settings omit the assigning status for a button target", () => {
  const view = renderComponent(
    <StickSettingsPanel
      layout={createDefaultLayout()}
      updateLayout={() => {}}
      assigningTarget={0}
      assignmentName="Button 1"
      cancelAssignment={() => {}}
    />,
  );

  assert.equal(view.queryByText("Button 1") === null, true);
});

test("confirmation modal is hidden when there is no pending message", () => {
  const view = renderComponent(
    <ConfirmationModal
      message={null}
      confirmLabel="Discard and open"
      onConfirm={() => {}}
      onCancel={() => {}}
    />,
  );

  assert.equal(view.queryByText("Discard and open") === null, true);
});

test("confirmation modal confirms or cancels the pending action", () => {
  const confirms: number[] = [];
  const cancels: number[] = [];
  const view = renderComponent(
    <ConfirmationModal
      message="Discard unsaved changes?"
      confirmLabel="Discard and open"
      onConfirm={() => confirms.push(1)}
      onCancel={() => cancels.push(1)}
    />,
  );

  assert.ok(view.getByText("Discard unsaved changes?"));
  fireEvent.click(view.getByRole("button", { name: "Discard and open" }));
  assert.deepEqual(confirms, [1]);

  fireEvent.click(view.getByRole("button", { name: "cancel" }));
  assert.deepEqual(cancels, [1]);
});
