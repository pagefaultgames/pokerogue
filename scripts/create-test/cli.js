/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import chalk from "chalk";
import { cliAliases, validTestTypes } from "./constants.js";
import { promptFileName, promptTestType } from "./interactive.js";

/**
 * @import {testType} from "./constants.js"
 */

/**
 * Parse `process.argv` to retrieve the test type if it exists, otherwise prompting input from the user.
 * @param {string | undefined} arg - The argument from `process.argv`
 * @returns {Promise<testType | undefined>}
 * A Promise that resolves with the type of test to be created, or `undefined` if the user interactively selects "Exit".
 * Will set `process.exitCode` to a non-zero integer if args are invalid.
 */
export async function getTestType(arg) {
  if (arg == null) {
    return await promptTestType();
  }

  const testType = getCliTestType(arg);
  if (testType) {
    console.log(chalk.blue(`Using ${testType} as test type from CLI...`));
    return testType;
  }
  console.error(
    chalk.red.bold(
      `✗ Invalid type of test file specified: ${arg}!\nValid types: ${chalk.blue(validTestTypes.join(", "))}`,
    ),
  );
  process.exitCode = 1;
  return;
}

/**
 * Parse a test type from command-line args.
 * @param {string} arg
 * @returns {testType | undefined} The resulting test type.
 * Will return `undefined` if no valid match was found.
 */
function getCliTestType(arg) {
  // Check for a direct match, falling back to alias checking if none work
  const testTypeName = validTestTypes.find(c => c.toLowerCase() === arg.toLowerCase());
  if (testTypeName) {
    return testTypeName;
  }

  const alias = /** @type {(keyof typeof cliAliases)[]} */ (Object.keys(cliAliases)).find(aliasKey =>
    cliAliases[aliasKey].some(alias => alias.toLowerCase() === arg.toLowerCase()),
  );
  return alias;
}

/**
 * Obtain the file name for a given file
 * @param {testType} testType - The chosen test type
 * @param {string | undefined} arg - The contents of `process.argv[3]`, if it exists
 * @returns {Promise<string | undefined>} A promise that resolves with the name of the file to create.
 */
export async function getFileName(testType, arg) {
  if (arg == null) {
    return await promptFileName(testType);
  }

  const nameTrimmed = arg.trim().replace(".test.ts", "");
  if (nameTrimmed.length === 0) {
    console.error(chalk.red.bold("✗ Cannot use an empty string as a file name!"));
    process.exitCode = 1;
    return;
  }

  console.log(chalk.blue(`Using ${nameTrimmed} as file name from CLI...`));
  return nameTrimmed;
}
