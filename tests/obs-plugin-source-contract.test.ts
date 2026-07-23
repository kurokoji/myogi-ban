import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("OBS source can manually show the current default layout", async () => {
  const source = await readFile("obs-plugin/src/myogi-ban-source.cpp", "utf8");
  const japaneseLocale = await readFile(
    "obs-plugin/data/locale/ja-JP.ini",
    "utf8",
  );

  assert.match(source, /obs_properties_add_button/);
  assert.match(source, /read_dimensions/);
  assert.match(source, /update_browser/);
  assert.match(source, /recreate_browser\(context\)/);
  assert.equal(
    source.match(/apply_dimensions\(context, dimensions\)/g)?.length,
    2,
  );
  assert.match(
    japaneseLocale,
    /ShowDefaultLayout="現在のデフォルトレイアウトを表示"/,
  );
});
