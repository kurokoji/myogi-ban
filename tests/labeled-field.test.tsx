// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { componentDocument, renderComponent } from "./component-render";
import { LabeledField } from "../src/components/editor/EditorInputs";

test("labeled field renders its label above whatever control is passed as children", () => {
  renderComponent(
    <LabeledField inputId="demo" label="Demo">
      <input id="demo" type="text" />
    </LabeledField>,
  );

  const input = componentDocument.getElementById("demo") as HTMLInputElement;
  assert.equal(input.tagName, "INPUT");

  const label = componentDocument.querySelector("label") as HTMLElement;
  assert.equal(label.textContent, "Demo");
  assert.equal(label.getAttribute("for"), "demo");
});

test("labeled field gives its label the same weight and size Mantine gives its own input labels", () => {
  renderComponent(
    <LabeledField inputId="demo" label="Demo">
      <input id="demo" type="text" />
    </LabeledField>,
  );

  const label = componentDocument.querySelector("label") as HTMLElement;
  assert.equal(label.style.fontWeight, "var(--mantine-font-weight-regular)");
  assert.equal(label.style.fontSize, "11px");
});
