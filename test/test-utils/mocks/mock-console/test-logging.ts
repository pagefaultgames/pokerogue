import path from "node:path";
import chalk from "chalk";
import type { RunnerTaskResult, TestContext } from "vitest";

/**
 * Log the testfile name, path and result upon a case ending. \
 * Used to compensate for us overridding the global Console object and removing Vitest's
 * test name annotations.
 * @param context - The {@linkcode TestContext} passed from the `afterEach` hook.
 */
export function logTestEnd(context: TestContext): void {
  // Avoid outputting test end messages for passing tests on CI to save time
  if (process.env.CI && context.task.result?.state === "pass") {
    return;
  }
  const resultStr = getResultStr(context.task.result);
  console.log(`> ${chalk.black.bgHex("#c162de")(" Test finished! ")}
  Name: ${chalk.hex("#008886ff")(context.task.name)}
  Result: ${resultStr}
  File: ${chalk.hex("#d20e28ff")(
    getPathFromTest(context.task.file.filepath) +
      (context.task.location ? `:${context.task.location.line}:${context.task.location.column}` : ""),
  )}
`);
}

function getPathFromTest(abs: string): string {
  // Get the directory name of the root folder (#test)
  const testRoot = path.join(import.meta.dirname, "..", "..", "..");
  return path.join(path.basename(testRoot), path.relative(testRoot, abs));
}

function getResultStr(result: RunnerTaskResult | undefined): string {
  if (result?.state !== "pass" && result?.state !== "fail") {
    return "Unknown";
  }

  let resultStr =
    result.state === "pass"
      ? chalk.green.bold("✔ Passed")
      : (result?.duration ?? 0) > 2
        ? chalk.cyan.bold("◴ Timed out")
        : chalk.red.bold("✗ Failed");

  if (result.duration !== undefined) {
    resultStr += ` in ${chalk.hex("#ffa200ff")(result.duration)}ms`;
  }
  return resultStr;
}
