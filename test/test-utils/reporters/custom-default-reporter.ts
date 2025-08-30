import { TEST_NAME_COLOR, VITEST_PINK_COLOR } from "#app/constants/colors";
import { basename, join, relative } from "node:path";
import { parseStacktrace } from "@vitest/utils/source-map";
import chalk from "chalk";
import type { RunnerTask, RunnerTaskResult, UserConsoleLog } from "vitest";
import type { TestCase, TestState } from "vitest/node";
import { DefaultReporter } from "vitest/reporters";

/** A long string of "="s to partition off each test from one another. */
const TEST_END_BARRIER = chalk.bold.hex("#ff7c7cff")("==================");

/**
 * Custom Vitest reporter to strip the log names from the output.
 */
export default class DefaultReporterButCleaner extends DefaultReporter {
  public override onUserConsoleLog(log: UserConsoleLog, taskState?: TestState): void {
    // This code is more or less copied verbatim from Vitest source, with minor tweaks to use
    // dependencies we actually _have_ (i.e. chalk) rather than ones we don't (i.e. tinyrainbow).
    if (!super.shouldLog(log, taskState)) {
      return;
    }

    const output = log.type === "stdout" ? this.ctx.logger.outputStream : this.ctx.logger.errorStream;

    const write = (msg: string) => output.write(msg);

    const task = log.taskId ? this.ctx.state.idMap.get(log.taskId) : undefined;

    write(log.content);

    // Code for stack trace, ripped directly out of Vitest source code.
    // I wish they had a helper function to do this so we didn't have to import `@vitest/utils`, but oh well...
    if (!log.origin) {
      return;
    }

    // browser logs don't have an extra end of line at the end like Node.js does
    if (log.browser) {
      write("\n");
    }

    const project = task ? this.ctx.getProjectByName(task.file.projectName ?? "") : this.ctx.getRootProject();

    const stack = log.browser ? (project.browser?.parseStacktrace(log.origin) ?? []) : parseStacktrace(log.origin);

    const highlight = task && stack.find(i => i.file === task.file.filepath);

    for (const frame of stack) {
      const color = frame === highlight ? chalk.cyan : chalk.gray;
      const path = relative(project.config.root, frame.file);

      const positions = [frame.method, `${path}:${chalk.dim(`${frame.line}:${frame.column}`)}`]
        .filter(Boolean)
        .join(" ");

      write(color(` ${chalk.dim(">")} ${positions}\n`));
    }
  }

  public override onTestCaseReady(test: TestCase): void {
    super.onTestCaseReady(test);
    this.logTestStart(test);
  }

  public override onTestCaseResult(test: TestCase): void {
    super.onTestCaseResult(test);
    const runnerTask = this.ctx.state.idMap.get(test.id);
    if (runnerTask) {
      this.logTestEnd(runnerTask);
    }
  }

  // Add a newline to the log so we don't bork it
  public override onTestRunEnd(): void {
    this.log("\n");
    super.onTestRunEnd();
  }

  /**
   * Log the testfile name and path upon a case starting. \
   * Used to compensate for us overridding the global Console object and removing Vitest's
   * test name annotations.
   * @param test - The {@linkcode TestCase} passed from the context
   */
  private logTestStart(test: TestCase): void {
    this.log(TEST_END_BARRIER);
    this.log(
      `${chalk.dim("> ")}${chalk.hex(VITEST_PINK_COLOR)("Starting test: ")}${chalk.hex(TEST_NAME_COLOR)(test.fullName)}`,
    );
  }

  /**
   * Log the testfile name, path and result upon a case ending. \
   * Used to compensate for us overridding the global Console object and removing Vitest's
   * test name annotations.
   * @param task - The {@linkcode RunnerTask} passed from the context
   */
  private logTestEnd(task: RunnerTask): void {
    const resultStr = getResultStr(task.result);
    const durationStr = this.getDurationPrefix(task);
    this.log(`${chalk.dim("> ")}${chalk.black.bgHex(VITEST_PINK_COLOR)(" Test finished! ")}
    Name: ${chalk.hex(TEST_NAME_COLOR)(task.name)}
    Result: ${resultStr}${durationStr ? " in" + durationStr : ""}
    File: ${chalk.hex("#d20e28ff")(
      getPathFromTest(task.file.filepath) + (task.location ? `:${task.location.line}:${task.location.column}` : ""),
    )}`);
  }
}

const testRoot = join(import.meta.dirname, "..", "..", "..");

/**
 * Get the path of the current test file relative to the `test` directory.
 * @param abs - The absolute path to the file
 * @returns The relative path with `test/` appended to it.
 */
function getPathFromTest(abs: string): string {
  return join(basename(testRoot), relative(testRoot, abs));
}

function getResultStr(result: RunnerTaskResult | undefined): string {
  if (result?.state !== "pass" && result?.state !== "fail") {
    return "Unknown";
  }

  const resultStr =
    result.state === "pass"
      ? chalk.green.bold("✔ Passed")
      : (result?.duration ?? 0) > 2
        ? chalk.cyan.bold("◴ Timed out")
        : chalk.red.bold("✗ Failed");

  return resultStr;
}
