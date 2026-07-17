export function createTestRunnerArguments(testFiles, userArguments) {
  return ["--test", "--test-reporter=spec", ...userArguments, ...testFiles];
}

export function isTestFile(fileName) {
  return /\.test\.tsx?$/.test(fileName);
}
