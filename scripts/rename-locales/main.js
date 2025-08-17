/*
 * This script takes one or more JSON files
 * and renames the keys in each to a consistent `camelCase`.
 * Usage: `pnpm rename-locales`
 */

import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import inquirer from "inquirer";
import { toCamelCase } from "../helpers/strings.js";
import { showHelpText } from "./help-message.js";

const version = "1.0.0";
const cwd = process.cwd();

/**
 * All supported command-line mode specifiers.
 */
const SUPPORTED_ARGS = /** @type {const} */ (["-a", "--absolute", "-r", "--relative", "-m", "--mixed"]);

async function main() {
  console.log(chalk.magenta(`✏️ Locales Renamer v${version}`));
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    showHelpText();
    return;
  }

  // Grab the last of `--absolute`, `--relative` or `--mixed` in the config
  const mode = getArgsValue(args);
  if (args.length === 0) {
    chalk.red.bold(`✗ Error: Malformed arguments!\nArgs: ${chalk.hex("#7310fdff")(process.argv.slice(2).join(", "))}`);
    showHelpText();
    process.exitCode = 1;
    return;
  }
  // Split the args by commas or semicolons
  const files = args.join(",").split(/[,;]+/);

  if (files.length >= 10 && !(await confirmInput(files))) {
    process.exitCode = 1;
    return;
  }

  doRename(files, mode);
}

/**
 * @typedef {"absolute" | "relative" | "mixed"}
 * mode
 * The mode to handle relative paths with.
 */

/**
 * Determine the file path mode.
 * @param {string[]} args - The process' command-line args
 * @returns {mode} The mode to use
 * @remarks
 * This mutates the `args` array to remove all mode specifiers.
 */
function getArgsValue(args) {
  const absSpecifier = args.findLast(
    /** @type {(arg: string) => arg is SUPPORTED_ARGS[number]} */ arg =>
      /** @type {readonly string[]} */ (SUPPORTED_ARGS).includes(arg),
  );
  args = args.filter(arg => !(/** @type {readonly string[]} */ (SUPPORTED_ARGS).includes(arg)));

  switch (absSpecifier) {
    case "-a":
    case "--absolute":
      return "absolute";
    case "-r":
    case "--relative":
      return "relative";
    case "-m":
    case "--mixed":
    case undefined:
      return "mixed";
  }
}

/**
 * Ask for confirmation before running on a large number of files.
 * @param {string[]} files - The files being parsed
 * @returns {Promise<boolean>} whether yes or no was selected
 */
async function confirmInput(files) {
  return (
    await inquirer.prompt([
      {
        type: "confirm",
        name: "continue",
        message:
          `You are currently attempting to rename a total of ${files.length} files.` +
          "\nContinue?" +
          `\nFiles: \n${chalk.blue(files.length <= 50 ? files.join(", \n") : files.slice(0, 50).join(", \n") + chalk.grey(`...and ${files.length - 50} more`))}` +
          "\n",
        default: false,
      },
    ])
  ).continue;
}

/**
 * Rename all files in `srcPath` to camel case.
 * @param {string[]} files - The paths to rename
 * @param {mode} absolute - Whether to interpret paths as relative or exact.
 * @returns {void}
 */
function doRename(files, absolute) {
  const keyRegex = /".*":/g;
  try {
    for (const filePath of files) {
      const actualPath = handleRelativePath(filePath, absolute);
      if (!actualPath.match(/public\/locales\/.*\.json/g)) {
        console.log(chalk.yellow(`Skipping ${actualPath} - not JSON inside locales folder.`));
        continue;
      }
      let content = fs.readFileSync(actualPath, "utf-8");
      const matches = content.matchAll(keyRegex);
      if (!matches) {
        continue;
      }
      for (const match of matches) {
        content = content.replace(match[0], toCamelCase(match[0]));
      }
      fs.writeFileSync(actualPath, content, "utf8");
      console.log(chalk.green.bold(`✔ Wrote to ${actualPath} successfully!`));
    }

    console.groupEnd();
  } catch (err) {
    console.error(chalk.red(`✗ Error while writing to file: ${err}`));
    process.exitCode = 1;
  }
}

/**
 * Check whether a given path is relative or exact.
 * @param {string} filePath - The paths to rename
 * @param {mode} absolute - Whether to interpret paths as relative or exact
 * @returns {string} The modified path
 */
function handleRelativePath(filePath, absolute) {
  switch (absolute) {
    case "absolute":
      return filePath;
    case "relative":
      return path.join(cwd, filePath);
    case "mixed":
      return /(?:\/|\w:\\\\)/g.test(filePath) ? filePath : path.join(cwd, filePath);
  }
}

main();
