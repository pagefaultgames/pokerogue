/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import chalk from "chalk";

/**
 * Array containing all valid ways of showing the help message.
 */
export const HELP_FLAGS = /** @type {const} */ (["-h", "-help", "--help"]);

/**
 * Show help/usage text for the `test:create` CLI.
 * @package
 */
export function showHelpText() {
  console.log(`
Usage: ${chalk.cyan("pnpm test:create [options] [testType] [fileName]")}
If either ${chalk.hex("#7fff00")("testType")} or ${chalk.hex("#7fff00")("fileName")} are omitted,
they will be selected interactively.

${chalk.hex("#8a2be2")("Arguments:")}
  ${chalk.hex("#7fff00")("testType")}                  The type/category of test file to create.
  ${chalk.hex("#7fff00")("fileName")}                  The name of the test file to create.

${chalk.hex("#ffa500")("Options:")}
  ${chalk.blue("-h, -help, --help")}         Show this help message.
`);
}
