/*
 * This script accepts a CSV value or file path as input, parses the egg moves,
 * and writes the output to a TypeScript file.
 * It can be run interactively or with command line arguments.
 * Usage: `pnpm eggMoves:parse`
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { showHelpText } from "./help-message.js";
import { runInteractive } from "./interactive.js";
import { parseEggMoves } from "./parse.js";

const version = "1.0.0";

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..", "..");
const templatePath = path.join(__dirname, "egg-move-template.ts");
// TODO: Do we want this to be configurable?
const eggMoveTargetPath = path.join(projectRoot, "src/data/balance/egg-moves.ts");

/**
 * @typedef {{type: "Console" | "File", value: string} | {type: "Exit"}}
 * Option
 * An option selected by the user.
 */

/**
 * Runs the interactive eggMoves:parse CLI.
 * @returns {Promise<void>}
 */
async function start() {
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
  if (process.exitCode) {
    // If exit code is non-zero, return to allow it to propagate up the chain.
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
      // Help screen triggered; break out
      return;
  }

  await writeToFile(parseEggMoves(csv));
}

/**
 * Handle the arguments passed to the script and obtain the CSV input type.
 * @returns {Promise<{type: "Console" | "File", value: string} | {type: "Exit"}>} The input method selected by the user
 */
async function parseArguments() {
  const args = process.argv.slice(2); // first 2 args are node and script name (irrelevant)

  /** @type {string | undefined}  */
  const arg = args[0].split("=")[0]; // Yoink everything up to the first "=" to get the raw command
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
 * @returns {string} The CSV or file path from the arguments
 * @throws {Error} If arguments are malformed
 */
function getArgValue() {
  // If the user provided a value as argument 2, take that as the argument.
  // Otherwise, check the 1st argument to see if it contains an `=` and extract everything afterwards.
  /** @type {string | undefined} */
  let filePath = process.argv[3];
  const equalsIndex = process.argv[2].indexOf("=");
  if (equalsIndex > -1) {
    // If arg 3 was aleady existing and someone used `=` notation to assign a property, throw an error.
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
 * @param {string} moves - The parsed CSV
 * @returns {Promise<void>}
 */
export async function writeToFile(moves) {
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
 * @returns {void}
 */
function badArgs() {
  chalk.red.bold(`✗ Error: Malformed arguments!\nArgs: ${chalk.hex("#7310fdff")(process.argv.slice(2).join(" "))}`);
  showHelpText();
  process.exitCode = 1;
}

start();
