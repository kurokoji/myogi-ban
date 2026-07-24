import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Biome follows the working platform line endings", async () => {
  const config = JSON.parse(await readFile("biome.json", "utf8"));

  assert.equal(config.formatter.lineEnding, "auto");
});
