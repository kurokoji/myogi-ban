// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import "./component-render";
import { act, renderHook } from "@testing-library/react";
import { cloneLayout } from "../src/editor-helpers";
import {
  createButtonSelection,
  EMPTY_EDITOR_SELECTION,
  type EditorSelection,
} from "../src/editor-selection";
import { GamepadManager } from "../src/gamepad";
import { useEditorSelectionActions } from "../src/hooks/useEditorSelectionActions";
import { createDefaultLayout } from "../src/layout";
import type { Layout } from "../src/types";

function setup(initialSelection: EditorSelection = EMPTY_EDITOR_SELECTION) {
  const layoutRef = { current: createDefaultLayout() };
  let mappings = GamepadManager.createDefaultButtonMappings();
  let selection = initialSelection;
  let cancelAssignmentCalls = 0;

  const harness = {
    get layout(): Layout {
      return layoutRef.current;
    },
    get mappings() {
      return mappings;
    },
    get selection() {
      return selection;
    },
    get cancelAssignmentCalls() {
      return cancelAssignmentCalls;
    },
  };

  const { result, rerender } = renderHook(() =>
    useEditorSelectionActions({
      layoutRef,
      buttonMappings: mappings,
      selection,
      setButtonMappings: (next) => {
        mappings = next;
      },
      setSelection: (next) => {
        selection = typeof next === "function" ? next(selection) : next;
      },
      updateLayout: (updater) => {
        const next = cloneLayout(layoutRef.current);
        updater(next);
        layoutRef.current = next;
      },
      cancelAssignment: () => {
        cancelAssignmentCalls += 1;
      },
    }),
  );

  return { actions: () => result.current, harness, rerender };
}

test("addButton appends a button and selects it", () => {
  const { actions, harness } = setup();
  const before = harness.layout.totalbuttonshow;

  act(() => actions().addButton());

  assert.equal(harness.layout.totalbuttonshow, before + 1);
  assert.equal(harness.selection.primaryButtonIndex, before);
  assert.equal(harness.cancelAssignmentCalls, 1);
});

test("deleteSelection returns false when nothing is selected", () => {
  const { actions } = setup();
  let deleted = true;
  act(() => {
    deleted = actions().deleteSelection({ buttonIndexes: [], stick: false });
  });
  assert.equal(deleted, false);
});

test("deleteSelection removes the button and clears the selection", () => {
  const { actions, harness } = setup(createButtonSelection(0));
  const before = harness.layout.totalbuttonshow;

  let deleted = false;
  act(() => {
    deleted = actions().deleteSelection({ buttonIndexes: [0], stick: false });
  });

  assert.equal(deleted, true);
  assert.equal(harness.layout.totalbuttonshow, before - 1);
  assert.deepEqual(harness.selection, EMPTY_EDITOR_SELECTION);
});

test("duplicateSelection adds a copy and selects it", () => {
  const { actions, harness } = setup(createButtonSelection(0));
  const before = harness.layout.totalbuttonshow;

  act(() => actions().duplicateSelection({ buttonIndexes: [0], stick: false }));

  assert.equal(harness.layout.totalbuttonshow, before + 1);
  assert.equal(harness.selection.primaryButtonIndex, before);
});

test("resetSelectionRotation zeroes the rotation of selected buttons", () => {
  const { actions, harness } = setup(createButtonSelection(0));
  harness.layout.buttons[0].rotation = "45";

  act(() =>
    actions().resetSelectionRotation({ buttonIndexes: [0], stick: false }),
  );

  assert.equal(harness.layout.buttons[0].rotation, "0");
});

test("deleteSelectedButtons is a no-op when the selection is empty", () => {
  const { actions, harness } = setup();
  const before = harness.layout.totalbuttonshow;

  act(() => actions().deleteSelectedButtons());

  assert.equal(harness.layout.totalbuttonshow, before);
});
