/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { TestType } from "#create-test/constants";
import { validTestTypes } from "#create-test/constants";
import { input, select } from "@inquirer/prompts";
import chalk from "chalk";

/**
 * Prompt the user to select a test type via list.
 * @returns The selected type, or `undefined` if "Exit" was pressed.
 */
export async function promptTestType(): Promise<TestType | undefined> {
  const choice = await select({
    message: "What type of test would you like to create?",
    choices: [...validTestTypes, "EXIT"] as const,
  });

  if (choice === "EXIT") {
    console.log("Exiting...");
    process.exitCode = 0;
    return;
  }

  return choice;
}

/**
 * Prompt the user to provide a file name.
 * @param selectedType - The chosen type (used for the prompt message)
 * @returns The selected file name
 */
export async function promptFileName(selectedType: TestType): Promise<string> {
  const fileNameAnswer = await input({
    message: `Please provide the name of the ${selectedType}.`,
    validate: name => {
      const nameProcessed = name.trim().replace(".test.ts", "");
      if (nameProcessed.length === 0) {
        return chalk.red.bold("✗ Cannot use an empty string as a file name!");
      }
      return true;
    },
  });

  return fileNameAnswer.trim().replace(".test.ts", "");
}
