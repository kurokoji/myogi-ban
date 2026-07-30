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
    /onDownloadObsPlugin=\{updateStatus\.downloadObsPlugin\}/,
  );
  assert.match(source, /onInstallObsPlugin=\{updateStatus\.installObsPlugin\}/);
  assert.match(
    source,
    /import \{ UpdateCheckButton \} from "\.\/components\/editor\/UpdateCheckButton";/,
  );
  assert.match(source, /checking=\{updateStatus\.checking\}/);
  assert.match(source, /onCheckNow=\{updateStatus\.checkNow\}/);
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
