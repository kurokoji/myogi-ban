import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("both browser entry points load M PLUS 2 from Fontsource", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.dependencies["@fontsource-variable/m-plus-2"],
    "^5.3.0",
  );

  for (const entryPoint of ["src/editor.tsx", "src/viewer.tsx"]) {
    const source = readFileSync(entryPoint, "utf8");
    assert.match(source, /import "@fontsource-variable\/m-plus-2\/wght\.css";/);
  }

  const stylesheet = readFileSync("public/css/style.css", "utf8");
  assert.doesNotMatch(stylesheet, /MPLUS2-Variable\.woff2/);

  const license = readFileSync("public/fonts/MPLUS2-OFL.txt", "utf8");
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);

  const thirdPartyLicenses = readFileSync("THIRD_PARTY_LICENSES.md", "utf8");
  assert.match(
    thirdPartyLicenses,
    /M PLUS 2[\s\S]*coz-m\/MPLUS_FONTS[\s\S]*MPLUS2-OFL\.txt/,
  );
});

test("emoji rely on native system fonts instead of a self-hosted Fontsource package", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    "@fontsource/noto-color-emoji" in packageJson.dependencies,
    false,
  );

  for (const entryPoint of ["src/editor.tsx", "src/viewer.tsx"]) {
    const source = readFileSync(entryPoint, "utf8");
    assert.doesNotMatch(source, /@fontsource\/noto-color-emoji/);
  }

  const stylesheet = readFileSync("public/css/style.css", "utf8");
  assert.doesNotMatch(stylesheet, /"Noto Color Emoji"/);
  assert.match(stylesheet, /"Segoe UI Emoji"/);
  assert.match(stylesheet, /"Apple Color Emoji"/);
});

test("the editor loads M PLUS Code Latin from Fontsource", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(
    packageJson.dependencies["@fontsource-variable/m-plus-code-latin"],
    "^5.3.0",
  );

  const editorSource = readFileSync("src/editor.tsx", "utf8");
  assert.match(
    editorSource,
    /import "@fontsource-variable\/m-plus-code-latin\/wght\.css";/,
  );
});
