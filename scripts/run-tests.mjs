import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { build } from "esbuild";
import { createTestRunnerArguments } from "./test-runner-options.mjs";

const outputDir = mkdtempSync(join(tmpdir(), "myogi-ban-tests-"));

try {
  const entryPoints = readdirSync("tests")
    .filter((name) => name.endsWith(".test.ts"))
    .map((name) => join("tests", name));

  await build({
    entryPoints,
    bundle: true,
    platform: "node",
    format: "cjs",
    outdir: outputDir,
  });

  const testFiles = readdirSync(outputDir)
    .filter((name) => name.endsWith(".test.js"))
    .map((name) => join(outputDir, name));
  execFileSync(
    process.execPath,
    createTestRunnerArguments(testFiles, process.argv.slice(2)),
    {
      stdio: "inherit",
    },
  );
} finally {
  rmSync(outputDir, { recursive: true, force: true });
}
