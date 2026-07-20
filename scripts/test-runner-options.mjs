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
