import assert from "node:assert/strict";
import test from "node:test";
import {
  createTestRunnerArguments,
  isTestFile,
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
      "--test-name-pattern=layout",
      "first.test.js",
      "second.test.js",
    ],
  );
});

test("test runner discovers TypeScript component tests", () => {
  assert.equal(isTestFile("panel.test.tsx"), true);
  assert.equal(isTestFile("helper.test.ts"), true);
  assert.equal(isTestFile("panel.tsx"), false);
});
