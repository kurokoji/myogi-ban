// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { componentDocument, renderComponent } from "./component-render";
import { fireEvent } from "@testing-library/react";
import { LabeledSwitch } from "../src/components/editor/EditorInputs";

test("labeled switch shows its label above the switch, like the other compact controls", () => {
  const view = renderComponent(
    <LabeledSwitch label="Bold" checked={false} onChange={() => {}} />,
  );

  const input = view.getByLabelText("Bold") as HTMLInputElement;
  assert.equal(input.type, "checkbox");
  assert.equal(input.checked, false);

  const label = componentDocument.querySelector("label");
  assert.ok(label);
  assert.equal(
    label.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING,
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
});

test("clicking a labeled switch reports the new checked state", () => {
  const changes: boolean[] = [];
  const view = renderComponent(
    <LabeledSwitch
      label="Bold"
      checked={false}
      onChange={(event) => changes.push(event.target.checked)}
    />,
  );

  fireEvent.click(view.getByLabelText("Bold"));

  assert.deepEqual(changes, [true]);
});

test("a labeled switch's description is exposed as a description, not folded into its name", () => {
  const view = renderComponent(
    <LabeledSwitch
      label="Bold"
      description="inheritDefault"
      checked={false}
      onChange={() => {}}
    />,
  );

  const input = view.getByRole("switch", { name: "Bold" }) as HTMLInputElement;
  const descriptionId = input.getAttribute("aria-describedby");
  assert.ok(descriptionId);
  const description = componentDocument.getElementById(descriptionId);
  assert.equal(description?.textContent, "inheritDefault");
});

test("a labeled switch's description sits on its own line below the label by default", () => {
  const view = renderComponent(
    <LabeledSwitch
      label="Bold"
      description="inheritDefault"
      checked={false}
      onChange={() => {}}
    />,
  );

  const label = componentDocument.querySelector("label") as HTMLElement;
  const description = view.getByText("inheritDefault");

  assert.equal(label.style.display, "block");
  assert.equal(description.style.display, "block");
});

test("a labeled switch can place its description beside the label instead, so an inherited row is no taller than a plain one", () => {
  const view = renderComponent(
    <LabeledSwitch
      label="Bold"
      description="inheritDefault"
      descriptionPlacement="inline"
      checked={false}
      onChange={() => {}}
    />,
  );

  const label = componentDocument.querySelector("label") as HTMLElement;
  const description = view.getByText("inheritDefault");

  assert.equal(label.parentElement, description.parentElement);
  assert.equal(label.parentElement?.style.display, "flex");
});
