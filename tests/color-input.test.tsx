// biome-ignore-all assist/source/organizeImports: component DOM must load before Testing Library.
import assert from "node:assert/strict";
import test from "node:test";
import { renderComponent } from "./component-render";
import { fireEvent } from "@testing-library/react";
import { ColorInput } from "../src/components/editor/EditorInputs";

test("color input shows the committed value", () => {
  const view = renderComponent(
    <ColorInput label="Color" value="#112233" onChange={() => {}} />,
  );

  const input = view.getByLabelText("Color") as HTMLInputElement;
  assert.equal(input.value, "#112233");
});

test("color input updates its own display while dragging, without committing", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const changes: string[] = [];
  const view = renderComponent(
    <ColorInput
      label="Color"
      value="#112233"
      onChange={(event) => changes.push(event.target.value)}
    />,
  );
  const input = view.getByLabelText("Color") as HTMLInputElement;

  fireEvent.input(input, { target: { value: "#445566" } });

  assert.equal(input.value, "#445566");
  assert.deepEqual(changes, []);
});

test("color input does not commit while the user keeps dragging", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const changes: string[] = [];
  const view = renderComponent(
    <ColorInput
      label="Color"
      value="#112233"
      onChange={(event) => changes.push(event.target.value)}
    />,
  );
  const input = view.getByLabelText("Color") as HTMLInputElement;

  fireEvent.input(input, { target: { value: "#223344" } });
  t.mock.timers.tick(150);
  fireEvent.input(input, { target: { value: "#334455" } });
  t.mock.timers.tick(150);

  assert.deepEqual(changes, []);
});

test("color input commits shortly after the user stops dragging", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const changes: string[] = [];
  const view = renderComponent(
    <ColorInput
      label="Color"
      value="#112233"
      onChange={(event) => changes.push(event.target.value)}
    />,
  );
  const input = view.getByLabelText("Color") as HTMLInputElement;

  fireEvent.input(input, { target: { value: "#445566" } });
  t.mock.timers.tick(200);

  assert.deepEqual(changes, ["#445566"]);
});

test("color input flushes a pending commit if unmounted before the debounce fires", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const changes: string[] = [];
  const view = renderComponent(
    <ColorInput
      label="Color"
      value="#112233"
      onChange={(event) => changes.push(event.target.value)}
    />,
  );
  const input = view.getByLabelText("Color") as HTMLInputElement;

  fireEvent.input(input, { target: { value: "#998877" } });
  view.unmount();

  assert.deepEqual(changes, ["#998877"]);
});

test("color input follows value changes made from outside, such as undo", () => {
  const view = renderComponent(
    <ColorInput label="Color" value="#112233" onChange={() => {}} />,
  );

  view.rerender(
    <ColorInput label="Color" value="#778899" onChange={() => {}} />,
  );

  const input = view.getByLabelText("Color") as HTMLInputElement;
  assert.equal(input.value, "#778899");
});
