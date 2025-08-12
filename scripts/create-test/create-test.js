/*
 * This script creates a test boilerplate file in the appropriate
 * directory based on the type selected.
 * Usage: `pnpm test:create`
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import inquirer from "inquirer";

//#region Constants

const version = "2.0.1";
// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, "..", "..");

const choices = /** @type {const} */ (["Move", "Ability", "Item", "Reward", "Mystery Encounter", "Utils", "UI"]);
/** @typedef {choices[number]} choiceType */

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
  const choice = await inquirer
    .prompt([
      {
        type: "list",
        name: "selectedOption",
        message: "What type of test would you like to create?",
        choices: [...choices, "EXIT"],
      },
    ])
    .then(ta => ta.selectedOption);

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
  const fileNameAnswer = await inquirer
    .prompt([
      {
        type: "input",
        name: "userInput",
        message: `Please provide the name of the ${selectedType}.`,
      },
    ])
    .then(fa => fa.userInput);

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
    //   return path.join(__dirname, "boilerplates/reward.ts");
    default:
      return path.join(__dirname, "boilerplates/default.ts");
  }
}

/**
 * Runs the interactive test:create "CLI"
 * @returns {Promise<void>}
 */
async function runInteractive() {
  console.group(chalk.grey(`🧪 Create Test - v${version}\n`));

  try {
    const choice = await promptTestType();
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

    console.log(chalk.green.bold(`✔ File created at: test/${localDir}/${fileName}.test.ts\n`));
    console.groupEnd();
  } catch (err) {
    console.error(chalk.red("✗ Error: ", err));
  }
}

//#endregion
//#region Run

runInteractive();

//#endregion
