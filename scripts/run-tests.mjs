import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { build } from "esbuild";
import {
  createTestRunnerArguments,
  isTestFileForPlatform,
} from "./test-runner-options.mjs";

const outputDir = mkdtempSync(join("node_modules", ".myogi-ban-tests-"));

try {
  const entryPoints = readdirSync("tests")
    .filter((name) => isTestFileForPlatform(name, process.platform))
    .map((name) => join("tests", name));

  await build({
    entryPoints,
    bundle: true,
    packages: "external",
    platform: "node",
    format: "cjs",
    outdir: outputDir,
  });

  const testFiles = readdirSync(outputDir)
    .filter((name) => name.endsWith(".test.js"))
    .map((name) => resolve(outputDir, name));
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
