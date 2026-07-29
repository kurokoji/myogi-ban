// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { componentDocument, renderComponent } from "./component-render";
import { fireEvent } from "@testing-library/react";
import { useState } from "react";
import { InspectorTabs } from "../src/components/editor/InspectorTabs";

test("inspector tabs render a tab per section and default to the first tab's content", () => {
  const view = renderComponent(
    <InspectorTabs
      tabs={[
        {
          value: "background",
          label: "Background",
          content: <p>Background body</p>,
        },
        { value: "stick", label: "Stick", content: <p>Stick body</p> },
      ]}
    />,
  );

  assert.ok(view.getByRole("tab", { name: "Background" }));
  assert.ok(view.getByRole("tab", { name: "Stick" }));
  assert.ok(view.getByText("Background body"));
  assert.equal(view.queryByText("Stick body") === null, true);
});

test("inspector tabs follow the active target requested from outside", () => {
  function Example() {
    const [activeTab, setActiveTab] = useState("background");
    return (
      <>
        <button type="button" onClick={() => setActiveTab("stick")}>
          Select stick
        </button>
        <InspectorTabs
          activeTab={activeTab}
          tabs={[
            {
              value: "background",
              label: "Background",
              content: <p>Background body</p>,
            },
            { value: "stick", label: "Stick", content: <p>Stick body</p> },
          ]}
        />
      </>
    );
  }

  const view = renderComponent(<Example />);
  assert.ok(view.getByText("Background body"));

  fireEvent.click(view.getByRole("button", { name: "Select stick" }));

  assert.equal(view.queryByText("Background body") === null, true);
  assert.ok(view.getByText("Stick body"));
});

test("clicking a tab shows its content without an external change", () => {
  const view = renderComponent(
    <InspectorTabs
      activeTab="background"
      tabs={[
        {
          value: "background",
          label: "Background",
          content: <p>Background body</p>,
        },
        { value: "buttons", label: "Buttons", content: <p>Buttons body</p> },
      ]}
    />,
  );

  fireEvent.click(view.getByRole("tab", { name: "Buttons" }));

  assert.equal(view.queryByText("Background body") === null, true);
  assert.ok(componentDocument.body.contains(view.getByText("Buttons body")));
});
