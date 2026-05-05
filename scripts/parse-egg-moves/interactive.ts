/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Bertie690
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { showHelpText } from "#parse-egg-moves/help-message";
import type { Option } from "#parse-egg-moves/types";
import fs from "node:fs";
import { input, select } from "@inquirer/prompts";

/**
 * Prompt the user to interactively select an option (console/file) to retrieve the egg move CSV.
 * @returns The selected option value
 */
export async function runInteractive(): Promise<Option> {
  const answer = await select({
    message: "Select the method to obtain egg moves.",
    choices: ["Console", "File", "Help", "Exit"] as const,
  });

  if (answer === "Exit") {
    console.log("Exiting...");
    process.exitCode = 0;
    return { type: "Exit" };
  }

  if (answer === "Help") {
    showHelpText();
    return { type: "Exit" };
  }

  return { type: answer, value: await promptForValue(answer) };
}

/**
 * Prompt the user to give a value (either the direct CSV or the file path).
 * @param type - The input method
 * @returns A Promise resolving with the CSV/file path.
 */
function promptForValue(type: "Console" | "File"): Promise<string> {
  switch (type) {
    case "Console":
      return doPromptConsole();
    case "File":
      return getFilePath();
  }
}

/**
 * Prompt the user to enter a file path from the console.
 * @returns The file path inputted by the user.
 */
async function getFilePath(): Promise<string> {
  return await input({
    message: "Please enter the path to the egg move CSV file.",
    validate: filePath => {
      if (filePath.trim() === "") {
        return "File path cannot be empty!";
      }
      if (!fs.existsSync(filePath)) {
        return "File does not exist!";
      }
      return true;
    },
  });
}

/**
 * Prompt the user for CSV input from the console.
 * @returns The CSV input from the user.
 */
async function doPromptConsole(): Promise<string> {
  return await input({
    message: "Please enter the egg move CSV text.",
    validate: value => {
      if (value.trim() === "") {
        return "CSV text cannot be empty!";
      }
      if (!value.match(/^[^,]+(,[^,]+){4}$/gm)) {
        return "CSV text malformed - should contain 5 consecutive comma-separated values per line!";
      }
      return true;
    },
  });
}
