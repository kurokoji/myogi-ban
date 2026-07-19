import assert from "node:assert/strict";
import test from "node:test";
import {
  editorNudgeHistoryMode,
  isEditableKeyboardTarget,
  nudgeEditorSelection,
} from "../src/editor-keyboard";
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
