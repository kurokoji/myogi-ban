import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("OBS source can manually show the current default layout", async () => {
  const source = await readFile("obs-plugin/src/myogi-ban-source.cpp", "utf8");
  const serverProcess = await readFile(
    "obs-plugin/src/server-process-windows.cpp",
    "utf8",
  );
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
  assert.doesNotMatch(serverProcess, /--server-only/);
});

test("OBS source provides theme-aware custom icons", async () => {
  const source = await readFile("obs-plugin/src/myogi-ban-source.cpp", "utf8");
  const darkIcon = await readFile(
    "obs-plugin/data/icons/myogi-ban-dark.svg",
    "utf8",
  );
  const lightIcon = await readFile(
    "obs-plugin/data/icons/myogi-ban-light.svg",
    "utf8",
  );

  assert.match(source, /\.icon_type = OBS_ICON_TYPE_CUSTOM/);
  assert.match(source, /\.get_dark_icon = source_dark_icon/);
  assert.match(source, /\.get_light_icon = source_light_icon/);
  assert.match(darkIcon, /viewBox="0 0 1024 1024"/);
  assert.match(darkIcon, /fill="#ffffff"/);
  assert.match(lightIcon, /fill="#000000"/);
});
