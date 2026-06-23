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

import { cliAliases, type TestType, validTestTypes } from "#create-test/constants";
import { getBoilerplatePath, getTestFileFullPath } from "#create-test/dirs";
import { promptFileName, promptTestType } from "#create-test/interactive";
import { defaultCommanderHelpArgs } from "#script-utils/arguments";
import { writeFileSafe } from "#script-utils/file";
import { toKebabCase, toTitleCase } from "#utils/strings";
import fs from "node:fs";
import { join } from "node:path";
import { Command, InvalidArgumentError } from "@commander-js/extra-typings";
import chalk from "chalk";

// #region Constants

const version = "2.1.2";
const projectRoot = join(import.meta.dirname, "..", "..");

// #endregion Constants

// #region Argument parsers

function parseTestType(arg: string): TestType {
  const match = validTestTypes.find(t => t.toLowerCase() === arg.toLowerCase());
  if (match) {
    return match;
  }

  const aliasMatch = (Object.keys(cliAliases) as (keyof typeof cliAliases)[]).find(key =>
    cliAliases[key].some(a => a.toLowerCase() === arg.toLowerCase()),
  );
  if (aliasMatch) {
    return aliasMatch;
  }

  throw new InvalidArgumentError(`Invalid test type "${arg}".\nValid types: ${chalk.blue(validTestTypes.join(", "))}`);
}

function parseFileName(arg: string): string {
  const trimmed = arg.trim().replace(".test.ts", "");
  if (trimmed.length === 0) {
    throw new InvalidArgumentError("Cannot use an empty string as a file name!");
  }
  return trimmed;
}

// #endregion Argument parsers

console.group(chalk.grey(`🧪 Create Test - v${version}\n`));

const program = new Command("pnpm test:create")
  .description("Create a test boilerplate file in the appropriate test directory.")
  .helpOption("-h, --help", "Show this help message.")
  .version(version, "-v, --version", "Show the version number.")
  .argument("[testType]", "The type/category of test file to create.", parseTestType)
  .argument("[fileName]", "The name of the test file to create.", parseFileName)
  .configureHelp(defaultCommanderHelpArgs)
  .showHelpAfterError(true)
  .parse();

const [testTypeArg, fileNameArg] = program.processedArgs;

// #region Main

/**
 * Run the interactive `test:create` CLI.
 */
async function runInteractive(): Promise<void> {
  const testType = testTypeArg ?? (await promptTestType());
  if (!testType) {
    return;
  }

  const fileNameAnswer = fileNameArg ?? (await promptFileName(testType));

  try {
    createTestFile(testType, fileNameAnswer);
  } catch (err) {
    console.error(chalk.red("✗", err));
  }
  console.groupEnd();
}

/**
 * Helper function to create the test file.
 * @param testType - The type of test to create
 * @param fileNameAnswer - The name of the file to create
 * @throws {Error} If the file to create already exists
 */
function createTestFile(testType: TestType, fileNameAnswer: string): void {
  const fileName = toKebabCase(fileNameAnswer);
  const formattedName = toTitleCase(fileNameAnswer);
  const description = `${testType} - ${formattedName}`;

  const content = fs.readFileSync(getBoilerplatePath(testType), "utf8").replace("{{description}}", description);
  const filePath = getTestFileFullPath(testType, fileName);
  if (fs.existsSync(filePath)) {
    throw new Error(`File "${filePath}" already exists!`);
  }

  writeFileSafe(filePath, content, "utf8");

  console.log(chalk.green.bold(`✔ File created at: ${filePath.replace(`${projectRoot}/`, "")}\n`));
}

// #endregion Main

await runInteractive();
