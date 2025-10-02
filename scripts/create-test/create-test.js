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
import path, { join } from "node:path";
import chalk from "chalk";
import inquirer from "inquirer";

//#region Constants

const version = "2.0.2";
// Get the directory name of the current module file
const __dirname = import.meta.dirname;
const projectRoot = path.join(__dirname, "..", "..");

const choices = /** @type {const} */ (["Move", "Ability", "Item", "Reward", "Mystery Encounter", "Utils", "UI"]);
/** @typedef {typeof choices[number]} choiceType */
/**
 * Object mapping choice types to extra names they can be used with from CLI.
 * @satisfies {Partial<Record<choiceType, readonly string[]>>}
 */
const cliAliases = {
  "Mystery Encounter": ["ME"],
};

/** @satisfies {{[k in choiceType]: string}} */
const choicesToDirs = /** @type {const} */ ({
  Move: "moves",
  Ability: "abilities",
  Item: "items",
  Reward: "rewards",
  "Mystery Encounter": "mystery-encounter/encounters",
  Utils: "utils",
  UI: "ui",
});

//#endregion
//#region Functions

/**
 * Get the path to a given folder in the test directory
 * @param {...string} folders the subfolders to append to the base path
 * @returns {string} the path to the requested folder
 */
function getTestFolderPath(...folders) {
  return path.join(projectRoot, "test", ...folders);
}

/**
 * Prompts the user to select a type via list.
 * @returns {Promise<choiceType>} the selected type
 */
async function promptTestType() {
  /** @type {choiceType | "EXIT"} */
  const choice = (
    await inquirer.prompt([
      {
        type: "list",
        name: "selectedOption",
        message: "What type of test would you like to create?",
        choices: [...choices, "EXIT"],
      },
    ])
  ).selectedOption;

  if (choice === "EXIT") {
    console.log("Exiting...");
    return process.exit(0);
  }

  return choice;
}

/**
 * Prompts the user to provide a file name.
 * @param {choiceType} selectedType The chosen string (used to display console logs)
 * @returns {Promise<string>} the selected file name
 */
async function promptFileName(selectedType) {
  /** @type {string} */
  const fileNameAnswer = (
    await inquirer.prompt([
      {
        type: "input",
        name: "userInput",
        message: `Please provide the name of the ${selectedType}.`,
      },
    ])
  ).userInput;

  if (fileNameAnswer.trim().length === 0) {
    console.error("Please provide a valid file name!");
    return await promptFileName(selectedType);
  }

  return fileNameAnswer;
}

/**
 * Obtain the path to the boilerplate file based on the current option.
 * @param {choiceType} choiceType The choice selected
 * @returns {string} The path to the boilerplate file
 */
function getBoilerplatePath(choiceType) {
  switch (choiceType) {
    // case "Reward":
    //   return path.join(__dirname, "boilerplates/reward.boilerplate.ts");
    default:
      return path.join(__dirname, "boilerplates/default.boilerplate.ts");
  }
}

/**
 * Parse `process.argv` and get the test type if it exists.
 * @returns {choiceType | undefined}
 * The type of choice the CLI args corresponds to, or `undefined` if none were specified.
 * Will set `process.exitCode` to a non-zero integer if args are invalid.
 */
function convertArgsToTestType() {
  // If the first argument is a test name, use that as the test name
  const args = process.argv.slice(2);
  if (args[0] == null) {
    return;
  }

  // Check for a direct match, falling back to alias checking.
  const choiceName = choices.find(c => c.toLowerCase() === args[0].toLowerCase());
  if (choiceName) {
    return choiceName;
  }

  const alias = /** @type {(keyof cliAliases)[]} */ (Object.keys(cliAliases)).find(k =>
    cliAliases[k].some(a => a.toLowerCase() === args[0].toLowerCase()),
  );
  if (alias) {
    return alias;
  }
  console.error(
    chalk.red.bold(`✗ Invalid type of test file specified: ${args[0]}!
Valid types: ${chalk.blue(choices.join(", "))}`),
  );
  process.exitCode = 1;
  return;
}

/**
 * Run the interactive `test:create` CLI.
 * @returns {Promise<void>}
 */
async function runInteractive() {
  console.group(chalk.grey(`🧪 Create Test - v${version}\n`));

  const cliTestType = convertArgsToTestType();
  if (process.exitCode) {
    return;
  }
  // TODO: Add a help command
  try {
    let choice;
    if (cliTestType) {
      console.log(chalk.blue(`Using ${cliTestType} as test type from CLI...`));
      choice = cliTestType;
    } else {
      choice = await promptTestType();
    }
    const fileNameAnswer = await promptFileName(choice);

    // Convert fileName from snake_case or camelCase to kebab-case
    const fileName = fileNameAnswer
      .replace(/_+/g, "-") // Convert snake_case (underscore) to kebab-case (dashes)
      .replace(/([a-z])([A-Z])/g, "$1-$2") // Convert camelCase to kebab-case
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .toLowerCase(); // Ensure all lowercase

    // Format the description for the test case in Title Case
    const formattedName = fileName.replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase());
    const description = `${choice} - ${formattedName}`;

    // Determine the directory based on the type
    const localDir = choicesToDirs[choice];
    const absoluteDir = getTestFolderPath(localDir);

    // Define the content template
    const content = fs.readFileSync(getBoilerplatePath(choice), "utf8").replace("{{description}}", description);

    // Ensure the directory exists
    if (!fs.existsSync(absoluteDir)) {
      fs.mkdirSync(absoluteDir, { recursive: true });
    }

    // Create the file with the given name
    const filePath = path.join(absoluteDir, `${fileName}.test.ts`);

    if (fs.existsSync(filePath)) {
      console.error(chalk.red.bold(`✗ File "${fileName}.test.ts" already exists!\n`));
      process.exit(1);
    }

    // Write the template content to the file
    fs.writeFileSync(filePath, content, "utf8");

    console.log(chalk.green.bold(`✔ File created at: ${join("test", localDir, fileName)}.test.ts\n`));
    console.groupEnd();
  } catch (err) {
    console.error(chalk.red("✗ Error: ", err));
  }
}

//#endregion
//#region Run

runInteractive();

//#endregion
