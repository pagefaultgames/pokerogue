/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import chalk from "chalk";
import inquirer from "inquirer";
import { validTestTypes } from "./constants.js";

/**
 * @import {testType} from "./constants.js"
 */
/**
 * Prompt the user to select a test type via list.
 * @returns {Promise<testType | undefined>} The selected type, or `undefined` if "Exit" was pressed.
 */
export async function promptTestType() {
  /** @type {testType | "EXIT"} */
  const choice = (
    await inquirer.prompt([
      {
        type: "list",
        name: "selectedOption",
        message: "What type of test would you like to create?",
        choices: [...validTestTypes, "EXIT"],
      },
    ])
  ).selectedOption;

  if (choice === "EXIT") {
    console.log("Exiting...");
    process.exitCode = 0;
    return;
  }

  return choice;
}

/**
 * Prompt the user to provide a file name.
 * @param {testType} selectedType - The chosen string (used for logging & validation)
 * @returns {Promise<string>} The selected file name
 */
export async function promptFileName(selectedType) {
  /** @type {string} */
  const fileNameAnswer = (
    await inquirer.prompt([
      {
        type: "input",
        name: "userInput",
        message: `Please provide the name of the ${selectedType}.`,
        validate: name => {
          const nameProcessed = name.trim().replace(".test.ts", "");
          if (nameProcessed.length === 0) {
            return chalk.red.bold("✗ Cannot use an empty string as a file name!");
          }
          return true;
        },
      },
    ])
  ).userInput;

  // Trim whitespace and any extension suffixes
  return fileNameAnswer.trim().replace(".test.ts", "");
}
