import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("the editor renders the update popup driven by useUpdateStatus", async () => {
  const source = await readFile("src/editor.tsx", "utf8");
  assert.match(
    source,
    /import \{ UpdatePopup \} from "\.\/components\/editor\/UpdatePopup";/,
  );
  assert.match(
    source,
    /import \{ useUpdateStatus \} from "\.\/hooks\/useUpdateStatus";/,
  );
  assert.match(
    source,
    /const updateStatus = useUpdateStatus\(apiRef\.current\);/,
  );
  assert.match(source, /status=\{updateStatus\.status\}/);
  assert.match(source, /onDownload=\{updateStatus\.download\}/);
  assert.match(source, /onInstall=\{updateStatus\.install\}/);
  assert.match(
    source,
    /import \{ UpdateCheckButton \} from "\.\/components\/editor\/UpdateCheckButton";/,
  );
  assert.match(source, /checking=\{updateStatus\.checking\}/);
  assert.match(source, /onCheckNow=\{updateStatus\.checkNow\}/);
});

test("the editor renders a persistent ObsSetupPanel, independent of the app update popup", async () => {
  // obsPluginAvailable no longer implies an app update is pending, so this
  // must not live inside UpdatePopup (gated on updateAvailable) -- otherwise
  // the download path disappears once the app itself is up to date but the
  // OBS plugin installer was never grabbed.
  const source = await readFile("src/editor.tsx", "utf8");
  assert.match(
    source,
    /import \{ ObsSetupPanel \} from "\.\/components\/editor\/ObsSetupPanel";/,
  );

  const block = source.match(/<ObsSetupPanel\b[\s\S]*?\/>/)?.[0];
  assert.ok(block, "ObsSetupPanel usage not found");
  assert.match(block as string, /obsUrl=\{obsUrl\}/);
  assert.match(block as string, /copiedObsUrl=\{copiedObsUrl\}/);
  assert.match(block as string, /onCopyObsUrl=\{copyObsUrl\}/);
  assert.match(
    block as string,
    /updateStatus\.status\?\.installSupported\s*&&\s*updateStatus\.status\?\.obsPluginAvailable/,
  );
  assert.match(
    block as string,
    /updateStatus\.status\?\.obsPluginDownload\s*\?\?\s*\{ state: "idle" \}/,
  );
  assert.match(
    block as string,
    /onDownloadObsPlugin=\{updateStatus\.downloadObsPlugin\}/,
  );
  assert.match(
    block as string,
    /onInstallObsPlugin=\{updateStatus\.installObsPlugin\}/,
  );
});

test("the editor renders the what's new popup driven by useWhatsNew", async () => {
  const source = await readFile("src/editor.tsx", "utf8");
  assert.match(
    source,
    /import \{ WhatsNewPopup \} from "\.\/components\/editor\/WhatsNewPopup";/,
  );
  assert.match(
    source,
    /import \{ useWhatsNew \} from "\.\/hooks\/useWhatsNew";/,
  );
  assert.match(source, /const whatsNew = useWhatsNew\(apiRef\.current\);/);
  assert.match(source, /notes=\{whatsNew\.popup\}/);
  assert.match(source, /onClose=\{whatsNew\.dismiss\}/);
  assert.match(source, /onClick=\{whatsNew\.viewNotes\}/);
});
