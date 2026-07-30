import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { REPO_URL } from "../src/app-constants";

test("REPO_URL points at the project's GitHub repository", () => {
  assert.equal(REPO_URL, "https://github.com/kurokoji/myogi-ban");
});

test("the editor sidebar links to the GitHub repository", async () => {
  const source = await readFile("src/editor.tsx", "utf8");
  assert.match(source, /import \{ REPO_URL[,\s]/);
  assert.match(source, /href=\{REPO_URL\}/);
  assert.match(source, /aria-label=\{t\("githubRepository"\)\}/);

  const block = source
    .match(/<ActionIcon\b[\s\S]*?<\/ActionIcon>/g)
    ?.find((candidate) => candidate.includes("REPO_URL"));
  assert.ok(block, "GitHub ActionIcon block not found");
  assert.match(block as string, /component="a"/);
  assert.match(block as string, /target="_blank"/);
  assert.match(block as string, /rel="noreferrer"/);
  assert.match(block as string, /IconBrandGithub/);
});
