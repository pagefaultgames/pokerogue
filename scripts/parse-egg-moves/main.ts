/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 *
 * This script accepts a CSV value or file path as input, parses the egg moves,
 * and writes the output to a TypeScript file.
 * It can be run interactively or with command line arguments.
 * Usage: `pnpm eggMoves:parse`
 */

import { showHelpText } from "#parse-egg-moves/help-message";
import { runInteractive } from "#parse-egg-moves/interactive";
import { parseEggMoves } from "#parse-egg-moves/parse";
import type { Option } from "#parse-egg-moves/types";
import fs from "node:fs";
import { join } from "node:path";
import chalk from "chalk";

const version = "1.0.1";

const projectRoot = join(import.meta.dirname, "..", "..");
const templatePath = join(import.meta.dirname, "egg-move-template.boilerplate.ts");
// TODO: Do we want this to be configurable?
const eggMoveTargetPath = join(projectRoot, "src/data/balance/egg-moves.ts");

/**
 * Runs the interactive eggMoves:parse CLI.
 */
async function start(): Promise<void> {
  console.log(chalk.yellow(`🥚 Egg Move Parser - v${version}`));

  if (process.argv.length > 4) {
    console.error(
      chalk.redBright.bold(
        `✗ Error: Too many arguments provided!\nArgs: ${chalk.hex("#7310fdff")(process.argv.slice(2).join(" "))}`,
      ),
    );
    showHelpText();
    process.exitCode = 1;
    return;
  }

  let csv = "";
  const inputType = await parseArguments();
  // If exit code was set, return to allow it to propagate it up the chain.
  if (process.exitCode != null) {
    return;
  }
  switch (inputType.type) {
    case "Console":
      csv = inputType.value;
      break;
    case "File":
      csv = await fs.promises.readFile(inputType.value, "utf-8");
      break;
    case "Exit":
      return;
  }

  await writeToFile(parseEggMoves(csv));
}

/**
 * Handle the arguments passed to the script and obtain the CSV input type.
 * @returns The input method selected by the user
 */
async function parseArguments(): Promise<Option> {
  const args = process.argv.slice(2); // first 2 args are node and script name (irrelevant)

  // Yoink everything up to the first "=" to get the raw command, using nullish coalescing to convert
  // "no args" into "undefined"
  const arg: string | undefined = args[0]?.split("=")[0];
  switch (arg) {
    case "-f":
    case "--file":
      return { type: "File", value: getArgValue() };
    case "-t":
    case "--text":
    case "-c":
    case "--console":
      return { type: "Console", value: getArgValue() };
    case "-h":
    case "--help":
      showHelpText();
      process.exitCode = 0;
      return { type: "Exit" };
    case "--interactive":
    case "-i":
    case undefined:
      return await runInteractive();
    default:
      // If no arguments are found, check if it's a file path
      if (fs.existsSync(arg)) {
        console.log(chalk.green(`Using file path from stdin: ${chalk.blue(arg)}`));
        return { type: "File", value: arg };
      }
      badArgs();
      return { type: "Exit" };
  }
}

/**
 * Get the value of the argument provided.
 * @returns The CSV or file path from the arguments
 * @throws {Error} If arguments are malformed
 */
function getArgValue(): string {
  // If the user provided a value as argument 2, take that as the argument.
  // Otherwise, check the 1st argument to see if it contains an `=` and extract everything afterwards.
  let filePath: string | undefined = process.argv[3];
  const equalsIndex = process.argv[2].indexOf("=");
  if (equalsIndex > -1) {
    // If arg 3 was already existing and someone used `=` notation to assign a property, throw an error.
    filePath = filePath ? undefined : process.argv[2].slice(equalsIndex + 1);
  }

  if (!filePath?.trim()) {
    badArgs();
    return "";
  }
  // NB: It doesn't really matter that this can be `undefined` - we'll always break out by lieu of setting the exit code
  return filePath;
}

/**
 * Write out the parsed CSV to a file.
 * @param moves - The parsed CSV
 */
export async function writeToFile(moves: string): Promise<void> {
  try {
    // Read the template file, replacing the placeholder with the move table.
    const content = fs.readFileSync(templatePath, "utf8").replace(`"{{table}}"`, moves);

    if (fs.existsSync(eggMoveTargetPath)) {
      console.warn(chalk.hex("#ffa500")("\nEgg moves file already exists, overwriting...\n"));
    }

    // Write the template content to the file
    fs.writeFileSync(eggMoveTargetPath, content, "utf8");

    console.log(chalk.green.bold(`\n✔ Egg Moves written to ${eggMoveTargetPath}`));
    console.groupEnd();
  } catch (err) {
    console.error(chalk.red(`✗ Error while writing egg moves: ${err}`));
    process.exitCode = 1;
  }
}

/**
 * Do logging for incorrect or malformed CLI arguments.
 */
function badArgs(): void {
  chalk.red.bold(`✗ Error: Malformed arguments!\nArgs: ${chalk.hex("#7310fdff")(process.argv.slice(2).join(" "))}`);
  showHelpText();
  process.exitCode = 1;
}

await start();
