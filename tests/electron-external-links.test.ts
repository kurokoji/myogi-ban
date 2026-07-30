import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Electron opens target=_blank links in the user's default browser instead of a new Electron window", async () => {
  const source = await readFile("src/electron.ts", "utf8");
  assert.match(
    source,
    /import \{ app, BrowserWindow, shell \} from "electron";/,
  );
  assert.match(source, /window\.webContents\.setWindowOpenHandler\(/);
  assert.match(source, /shell\.openExternal\(url\)/);
  assert.match(
    source,
    /setWindowOpenHandler\(\(\{ url \}\) => \{[\s\S]*?shell\.openExternal\(url\);[\s\S]*?return \{ action: "deny" \};[\s\S]*?\}\)/,
  );
});
