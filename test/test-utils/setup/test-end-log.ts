/**
 * Code to add markers to the beginning and end of tests.
 * Intended for use with {@linkcode CustomDefaultReporter}, and placed inside test hooks
 * (rather than as part of the reporter) to ensure Vitest waits for the log messages to be printed before beginning subsequent cases.
 * @module
 */

import type CustomDefaultReporter from "#test/test-utils/reporters/custom-default-reporter";
import { join, relative } from "path";
import chalk from "chalk";
import type { RunnerTask, RunnerTaskResult, RunnerTestCase } from "vitest";

/** A long string of "="s to partition off each test from one another. */
const TEST_END_BARRIER = chalk.bold.hex("#ff7c7cff")("==================");

// Colors used for Vitest-related test utils
const TEST_NAME_COLOR = "#008886ff" as const;
const VITEST_PINK_COLOR = "#c162de" as const;

/**
 * The root directory of the project, used when constructing relative paths.
 * @privateRemarks
 * Will have to be altered if this file is moved!
 */
const rootDir = join(import.meta.dirname, "..", "..", "..");

/**
 * Log the testfile name and path upon a case starting. \
 * Used to compensate for us overridding the global Console object and removing Vitest's
 * test name annotations.
 * @param test - The {@linkcode RunnerTask} passed from the context
 */
export function logTestStart(test: RunnerTask): void {
  console.log(TEST_END_BARRIER);
  console.log(
    `${chalk.dim("> ")}${chalk.hex(VITEST_PINK_COLOR)("Starting test: ")}${chalk.hex(TEST_NAME_COLOR)(getTestName(test))}`,
  );
}

/**
 * Log the testfile name, path and result upon a case ending. \
 * Used to compensate for us overridding the global Console object and removing Vitest's
 * test name annotations.
 * @param task - The {@linkcode RunnerTestCase} passed from the hook
 */
export function logTestEnd(task: RunnerTestCase): void {
  const durationStr = getDurationPrefix(task.result);
  const resultStr = getResultStr(task.result);
  console.log(`${chalk.dim("> ")}${chalk.black.bgHex(VITEST_PINK_COLOR)(" Test finished! ")}
    Name: ${chalk.hex(TEST_NAME_COLOR)(getTestName(task))}
    Result: ${resultStr}${durationStr}
    File: ${chalk.hex("#d29b0eff")(
      // Formatting used to allow for IDE Ctrl+click shortcuts
      getRelativePath(task.file.filepath) + (task.location ? `:${task.location.line}:${task.location.column}` : ""),
    )}`);
}

/**
 * Get the path of the current test file relative to the project root.
 * @param abs - The absolute path to the file
 * @returns The path relative to the project root folder.
 */
function getRelativePath(abs: string): string {
  return relative(rootDir, abs);
}

function getResultStr(result: RunnerTaskResult | undefined): string {
  if (result?.state !== "pass" && result?.state !== "fail") {
    return "Unknown";
  }

  const resultStr =
    result.state === "pass"
      ? chalk.green.bold("✓ Passed")
      : (result?.duration ?? 0) > 20_000
        ? chalk.cyan.bold("◴ Timed out")
        : chalk.red.bold("✗ Failed");

  return resultStr;
}

/**
 * Get the text to be displayed for a test's duration.
 * @param result - The {@linkcode RunnerTaskResult} of the finished test
 * @returns An appropriately colored suffix for the start time.
 * Will return an empty string if `result.startTime` is `undefined`
 */
function getDurationPrefix(result?: RunnerTaskResult): string {
  const startTime = result?.startTime;
  if (!startTime) {
    return "";
  }
  const duration = Math.round(Date.now() - startTime);

  // TODO: Figure out a way to access the current vitest config from a hook
  const color = duration > 10_000 ? chalk.yellow : chalk.green;
  return ` ${chalk.dim("in")} ${color(duration)}${chalk.dim("ms")}`;
}

// Function copied from vitest source to avoid having to import `@vitest/runner/utils` for 1 function

// SPDX-SnippetBegin
// SPDX-SnippetCopyrightText: 2021 VoidZero Inc. and Vitest contributors
// SPDX-License-Identifier: MIT
function getTestName(task: RunnerTask, separator = " > "): string {
  const names: string[] = [task.name];
  let current: RunnerTask | undefined = task;

  while ((current = current?.suite)) {
    if (current?.name) {
      names.unshift(current.name);
    }
  }

  return names.join(separator);
}

// SPDX-SnippetEnd
