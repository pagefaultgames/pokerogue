/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * This script creates a test boilerplate file in the appropriate
 * directory based on the type selected.
 * Usage: `pnpm test:create`
 */

import fs from "node:fs";
import { join } from "node:path";
import chalk from "chalk";
import { writeFileSafe } from "../helpers/file.js";
import { toKebabCase, toTitleCase } from "../helpers/strings.js";
import { getFileName, getTestType } from "./cli.js";
import { getBoilerplatePath, getTestFileFullPath } from "./dirs.js";
import { HELP_FLAGS, showHelpText } from "./help-message.js";

/**
 * @import {testType} from "./constants.js"
 */

//#region Constants
const version = "2.1.0";
const __dirname = import.meta.dirname;
const projectRoot = join(__dirname, "..", "..");
//#endregion

//#region Main

/**
 * Run the interactive `test:create` CLI.
 * @returns {Promise<void>}
 */
async function runInteractive() {
  console.group(chalk.grey(`🧪 Create Test - v${version}\n`));

  const args = process.argv.slice(2);

  if (HELP_FLAGS.some(h => args.includes(h))) {
    return showHelpText();
  }

  const testType = await getTestType(args[0]);
  if (process.exitCode || !testType) {
    return;
  }

  const fileNameAnswer = await getFileName(testType, args[1]);
  if (process.exitCode || !fileNameAnswer) {
    return;
  }

  try {
    doCreateFile(testType, fileNameAnswer);
  } catch (err) {
    console.error(chalk.red("✗ Error: ", err));
  }
  console.groupEnd();
}

/**
 * Helper function to create the test file.
 * @param {testType} testType - The type of test to create
 * @param {string} fileNameAnswer - The name of the file to create
 * @returns {void}
 */
function doCreateFile(testType, fileNameAnswer) {
  // Convert file name to kebab-case, formatting the description in Title Case
  const fileName = toKebabCase(fileNameAnswer);
  const formattedName = toTitleCase(fileNameAnswer);
  const description = `${testType} - ${formattedName}`;

  const content = fs.readFileSync(getBoilerplatePath(testType), "utf8").replace("{{description}}", description);
  const filePath = getTestFileFullPath(testType, fileName);
  writeFileSafe(filePath, content, "utf8");

  console.log(chalk.green.bold(`✔ File created at: ${filePath.replace(`${projectRoot}/`, "")}\n`));
}

//#endregion

await runInteractive();
