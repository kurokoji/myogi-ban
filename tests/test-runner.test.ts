import assert from "node:assert/strict";
import test from "node:test";
import {
  createTestRunnerArguments,
  isTestFile,
  isTestFileForPlatform,
  shouldRunObsTests,
} from "../scripts/test-runner-options.mjs";

test("test runner uses the spec reporter and forwards CLI filters", () => {
  assert.deepEqual(
    createTestRunnerArguments(
      ["first.test.js", "second.test.js"],
      ["--test-name-pattern=layout"],
    ),
    [
      "--test",
      "--test-reporter=spec",
      "--test-concurrency=4",
      "--test-name-pattern=layout",
      "first.test.js",
      "second.test.js",
    ],
  );
});

test("test runner discovers OBS tests only on Windows", () => {
  assert.equal(shouldRunObsTests("win32"), true);
  assert.equal(shouldRunObsTests("linux"), false);
  assert.equal(isTestFileForPlatform("obs-plugin.test.ts", "win32"), true);
  assert.equal(isTestFileForPlatform("obs-plugin.test.ts", "linux"), false);
  assert.equal(isTestFileForPlatform("obs-sdk.test.ts", "darwin"), false);
  assert.equal(isTestFileForPlatform("layout.test.ts", "linux"), true);
});

test("test runner discovers TypeScript component tests", () => {
  assert.equal(isTestFile("panel.test.tsx"), true);
  assert.equal(isTestFile("helper.test.ts"), true);
  assert.equal(isTestFile("panel.tsx"), false);
});
