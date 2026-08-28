import assert from "node:assert/strict";
import test from "node:test";
import {
  decideEditorKeyboardAction,
  deleteEditorSelection,
  editorNudgeHistoryMode,
  editorShortcutFromKey,
  editorShortcutHint,
  isEditableKeyboardTarget,
  nudgeEditorSelection,
} from "../src/editor-keyboard";

const baseContext = {
  isEditableTarget: false,
  shortcut: null,
  repeat: false,
  selectionEmpty: true,
  hasSelectedButtons: false,
  currentBuiltin: false,
} as const;

test("decideEditorKeyboardAction ignores events from editable targets", () => {
  assert.deepEqual(
    decideEditorKeyboardAction({
      ...baseContext,
      isEditableTarget: true,
      shortcut: "save",
    }),
    { action: "none", preventDefault: false },
  );
});

test("decideEditorKeyboardAction saves on Ctrl+S but stays inert while repeating or on a builtin", () => {
  assert.deepEqual(
    decideEditorKeyboardAction({ ...baseContext, shortcut: "save" }),
    { action: "save", preventDefault: true },
  );
  assert.deepEqual(
    decideEditorKeyboardAction({
      ...baseContext,
      shortcut: "save",
      repeat: true,
    }),
    { action: "none", preventDefault: true },
  );
  assert.deepEqual(
    decideEditorKeyboardAction({
      ...baseContext,
      shortcut: "save",
      currentBuiltin: true,
    }),
    { action: "none", preventDefault: true },
  );
});

test("decideEditorKeyboardAction only clears a non-empty selection", () => {
  assert.deepEqual(
    decideEditorKeyboardAction({
      ...baseContext,
      shortcut: "clearSelection",
    }),
    { action: "none", preventDefault: false },
  );
  assert.deepEqual(
    decideEditorKeyboardAction({
      ...baseContext,
      shortcut: "clearSelection",
      selectionEmpty: false,
    }),
    { action: "clearSelection", preventDefault: true },
  );
});

test("decideEditorKeyboardAction suppresses repeated undo/redo", () => {
  assert.deepEqual(
    decideEditorKeyboardAction({
      ...baseContext,
      shortcut: "undo",
      repeat: true,
    }),
    { action: "none", preventDefault: true },
  );
});

test("decideEditorKeyboardAction defers delete preventDefault to the caller", () => {
  assert.deepEqual(
    decideEditorKeyboardAction({ ...baseContext, shortcut: "delete" }),
    { action: "delete", preventDefault: false },
  );
});

test("decideEditorKeyboardAction requires a button selection for duplicate and resetRotation", () => {
  assert.deepEqual(
    decideEditorKeyboardAction({ ...baseContext, shortcut: "duplicate" }),
    { action: "none", preventDefault: false },
  );
  assert.deepEqual(
    decideEditorKeyboardAction({
      ...baseContext,
      shortcut: "resetRotation",
      hasSelectedButtons: true,
    }),
    { action: "resetRotation", preventDefault: true },
  );
});

test("decideEditorKeyboardAction treats unrecognized keys as nudge candidates", () => {
  assert.deepEqual(
    decideEditorKeyboardAction({ ...baseContext, shortcut: null }),
    { action: "nudge", preventDefault: false },
  );
});

test("editorShortcutHint formats shortcuts for hover descriptions", () => {
  assert.equal(editorShortcutHint("save", "Win32"), "Ctrl+S");
  assert.equal(editorShortcutHint("undo", "MacIntel"), "Cmd+Z");
  assert.equal(editorShortcutHint("redo", "MacIntel"), "Cmd+Shift+Z");
  assert.equal(editorShortcutHint("duplicate", "Linux x86_64"), "Ctrl+D");
});

test("editorShortcutFromKey maps editing shortcuts across control and command", () => {
  assert.equal(
    editorShortcutFromKey({ key: "Delete", ctrlKey: false, metaKey: false }),
    "delete",
  );
  assert.equal(
    editorShortcutFromKey({ key: "Escape", ctrlKey: false, metaKey: false }),
    "clearSelection",
  );
  assert.equal(
    editorShortcutFromKey({ key: "s", ctrlKey: true, metaKey: false }),
    "save",
  );
  assert.equal(
    editorShortcutFromKey({ key: "a", ctrlKey: false, metaKey: true }),
    "selectAll",
  );
  assert.equal(
    editorShortcutFromKey({
      key: "z",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
    }),
    "undo",
  );
  assert.equal(
    editorShortcutFromKey({
      key: "Z",
      ctrlKey: false,
      metaKey: true,
      shiftKey: true,
    }),
    "redo",
  );
  assert.equal(
    editorShortcutFromKey({ key: "d", ctrlKey: true, metaKey: false }),
    "duplicate",
  );
  assert.equal(
    editorShortcutFromKey({ key: "C", ctrlKey: false, metaKey: true }),
    null,
  );
  assert.equal(
    editorShortcutFromKey({ key: "v", ctrlKey: true, metaKey: false }),
    null,
  );
  assert.equal(
    editorShortcutFromKey({ key: "r", ctrlKey: false, metaKey: false }),
    "resetRotation",
  );
  assert.equal(
    editorShortcutFromKey({ key: "r", ctrlKey: true, metaKey: false }),
    null,
  );
});

import { createButtonSelection } from "../src/editor-selection";
import { createDefaultLayout } from "../src/layout";

test("nudgeEditorSelection moves a selected button one pixel", () => {
  const layout = createDefaultLayout();

  const result = nudgeEditorSelection(
    layout,
    createButtonSelection(0),
    "ArrowRight",
  );

  assert.equal(result?.buttons[0].x, "226");
  assert.equal(result?.buttons[0].y, "80");
  assert.equal(layout.buttons[0].x, "225");
});

test("Delete deletes the selected button", () => {
  const layout = createDefaultLayout();
  const mappings = [0, 1, 2, 3, 4, 5, 6, 7];

  const result = deleteEditorSelection(
    layout,
    mappings,
    createButtonSelection(1),
    "Delete",
  );

  assert.equal(result?.layout.totalbuttonshow, 7);
  assert.equal(result?.layout.buttons[1].x, "335");
  assert.deepEqual(result?.mapping.slice(0, 3), [0, 2, 3]);
  assert.equal(layout.totalbuttonshow, 8);
  assert.equal(
    deleteEditorSelection(
      layout,
      mappings,
      createButtonSelection(1),
      "Backspace",
    ),
    null,
  );
});

test("Delete hides the selected stick", () => {
  const layout = createDefaultLayout();
  const mappings = [0, 1];

  const result = deleteEditorSelection(
    layout,
    mappings,
    { buttonIndexes: [], primaryButtonIndex: null, stick: true },
    "Delete",
  );

  assert.equal(result?.layout.showstick, false);
  assert.deepEqual(result?.mapping, mappings);
  assert.equal(layout.showstick, true);
});

test("nudgeEditorSelection moves every selected button in an arrow direction", () => {
  const layout = createDefaultLayout();

  const result = nudgeEditorSelection(
    layout,
    { buttonIndexes: [0, 1], primaryButtonIndex: 0, stick: false },
    "ArrowUp",
  );

  assert.deepEqual(
    result?.buttons.slice(0, 2).map(({ x, y }) => ({ x, y })),
    [
      { x: "225", y: "79" },
      { x: "280", y: "67" },
    ],
  );
});

test("nudgeEditorSelection moves the selected stick", () => {
  const layout = createDefaultLayout();

  const result = nudgeEditorSelection(
    layout,
    { buttonIndexes: [], primaryButtonIndex: null, stick: true },
    "ArrowDown",
  );

  assert.deepEqual(
    { x: result?.stick.x, y: result?.stick.y },
    { x: "130", y: "106" },
  );
});

test("isEditableKeyboardTarget recognizes form controls and editable content", () => {
  const editableTarget = {
    closest: (selector: string) => (selector.includes("input") ? {} : null),
  } as unknown as EventTarget;
  const previewTarget = {
    closest: () => null,
  } as unknown as EventTarget;

  assert.equal(isEditableKeyboardTarget(editableTarget), true);
  assert.equal(isEditableKeyboardTarget(previewTarget), false);
});

test("editorNudgeHistoryMode records the first keydown and continues repeats", () => {
  assert.equal(editorNudgeHistoryMode(false), "record");
  assert.equal(editorNudgeHistoryMode(true), "continue");
});
