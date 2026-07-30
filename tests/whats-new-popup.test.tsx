import assert from "node:assert/strict";
import test from "node:test";
import { fireEvent } from "@testing-library/react";
import { WhatsNewPopup } from "../src/components/editor/WhatsNewPopup";
import { renderComponent } from "./component-render";

test("renders nothing when there are no notes to show", () => {
  const view = renderComponent(
    <WhatsNewPopup notes={null} onClose={() => {}} />,
  );
  assert.equal(view.queryByRole("dialog") === null, true);
});

test("shows the release notes text and version", () => {
  const view = renderComponent(
    <WhatsNewPopup
      notes={{
        version: "1.0.18",
        notes: "- new stuff\n- more stuff",
        releaseUrl:
          "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
      }}
      onClose={() => {}}
    />,
  );

  assert.ok(view.getByRole("dialog"));
  assert.ok(view.getByText("whatsNewTitle"));
  assert.ok(view.getByText(/new stuff/));
  assert.ok(view.getByText(/more stuff/));
});

test("parses the notes as markdown instead of showing raw syntax", () => {
  const view = renderComponent(
    <WhatsNewPopup
      notes={{
        version: "1.0.18",
        notes: "## 日本語\n- new stuff\n\n## English\n- new stuff",
        releaseUrl:
          "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
      }}
      onClose={() => {}}
    />,
  );

  const heading = view.getByRole("heading", { name: "日本語", level: 2 });
  assert.ok(heading);
  const items = view.getAllByRole("listitem");
  assert.equal(items.length, 2);
  assert.equal(
    view.container.querySelector("li")?.textContent?.startsWith("- "),
    false,
  );
});

test("shows a fallback message and release-page link when notes are unavailable", () => {
  const view = renderComponent(
    <WhatsNewPopup
      notes={{
        version: "1.0.18",
        notes: null,
        releaseUrl:
          "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
      }}
      onClose={() => {}}
    />,
  );

  assert.ok(view.getByText("releaseNotesUnavailable"));
  const link = view.getByRole("link", {
    name: "openReleasePage",
  }) as HTMLAnchorElement;
  assert.equal(
    link.href,
    "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
  );
});

test("clicking close calls onClose", () => {
  let calls = 0;
  const view = renderComponent(
    <WhatsNewPopup
      notes={{
        version: "1.0.18",
        notes: "- new stuff",
        releaseUrl:
          "https://github.com/kurokoji/myogi-ban/releases/tag/v1.0.18",
      }}
      onClose={() => {
        calls += 1;
      }}
    />,
  );

  fireEvent.click(view.getByRole("button", { name: /close/i }));

  assert.equal(calls, 1);
});
