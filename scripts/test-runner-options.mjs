export function createTestRunnerArguments(testFiles, userArguments) {
  return [
    "--test",
    "--test-reporter=spec",
    "--test-concurrency=4",
    ...userArguments,
    ...testFiles,
  ];
}

export function isTestFile(fileName) {
  return /\.test\.tsx?$/.test(fileName);
}

export function shouldRunObsTests(platform) {
  return platform === "win32";
}

export function isTestFileForPlatform(fileName, platform) {
  if (!isTestFile(fileName)) return false;
  return shouldRunObsTests(platform) || !fileName.startsWith("obs-");
}
