import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { REPO_NAME, REPO_URL } from "../src/app-constants";

test("REPO_NAME and REPO_URL identify the project's GitHub repository", () => {
  assert.equal(REPO_NAME, "kurokoji/myogi-ban");
  assert.equal(REPO_URL, `https://github.com/${REPO_NAME}`);
});

test("the GitHub link shows the repository name as its text", async () => {
  const source = await readFile("src/editor.tsx", "utf8");
  assert.match(source, /href=\{REPO_URL\}/);

  const block = source.match(/<Anchor\b[\s\S]*?<\/Anchor>/)?.[0];
  assert.ok(block, "GitHub Anchor block not found");
  assert.match(block as string, /href=\{REPO_URL\}/);
  assert.match(block as string, /target="_blank"/);
  assert.match(block as string, /rel="noreferrer"/);
  assert.match(block as string, /IconBrandGithub/);
  assert.match(block as string, /\{REPO_NAME\}/);
});

test("the GitHub link sits below the title row, not beside it", async () => {
  const source = await readFile("src/editor.tsx", "utf8");
  const titleRowEnd = source.indexOf("</Title>");
  const updateRowStart = source.indexOf('<div className="update-check-row">');
  const linkIndex = source.indexOf("href={REPO_URL}");

  assert.ok(titleRowEnd > -1, "</Title> not found");
  assert.ok(updateRowStart > -1, "update-check-row not found");
  assert.ok(linkIndex > -1, "GitHub link not found");
  assert.ok(linkIndex > titleRowEnd, "GitHub link should come after the title");
  assert.ok(
    linkIndex < updateRowStart,
    "GitHub link should come before the update-check row",
  );
  assert.doesNotMatch(source, /sidebar-title-actions/);
});
