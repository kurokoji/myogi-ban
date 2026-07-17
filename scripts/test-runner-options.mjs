export function createTestRunnerArguments(testFiles, userArguments) {
  return ["--test", "--test-reporter=spec", ...userArguments, ...testFiles];
}
