// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import "./component-render";
import { fireEvent } from "@testing-library/react";
import { renderComponent } from "./component-render";
import { PreviewGuides } from "../src/components/editor/PreviewGuides";
import { PreviewRuler } from "../src/components/editor/PreviewRuler";

test("PreviewRuler labels only major ticks", () => {
  const view = renderComponent(
    <PreviewRuler
      ticks={[0, 25, 50]}
      majorStep={50}
      origin={{ x: 10, y: 20 }}
      scale={2}
      onStartGuideDrag={() => {}}
    />,
  );

  const labels = view.container.querySelectorAll(".preview-ruler-label");
  // 2 major ticks (0, 50) rendered on both the horizontal and vertical ruler
  assert.equal(labels.length, 4);
  assert.deepEqual(
    Array.from(labels).map((label) => label.textContent),
    ["0", "50", "0", "50"],
  );
});

test("PreviewRuler maps the horizontal ruler drag to the y axis", () => {
  let axis: string | null = null;
  const view = renderComponent(
    <PreviewRuler
      ticks={[0]}
      majorStep={50}
      origin={{ x: 0, y: 0 }}
      scale={1}
      onStartGuideDrag={(dragAxis) => {
        axis = dragAxis;
      }}
    />,
  );

  const horizontal = view.container.querySelector(
    ".preview-ruler-horizontal",
  ) as HTMLElement;
  fireEvent.mouseDown(horizontal);

  assert.equal(axis, "y");
});

test("PreviewGuides renders one draggable marker per guide", () => {
  const view = renderComponent(
    <PreviewGuides
      vertical={[100]}
      horizontal={[40, 80]}
      origin={{ x: 5, y: 7 }}
      scale={2}
      onStartExistingGuideDrag={() => {}}
    />,
  );

  assert.equal(
    view.container.querySelectorAll(".preview-guide-vertical").length,
    1,
  );
  assert.equal(
    view.container.querySelectorAll(".preview-guide-horizontal").length,
    2,
  );
  const vertical = view.container.querySelector(
    ".preview-guide-vertical",
  ) as HTMLElement;
  assert.equal(vertical.style.left, "205px");
});
