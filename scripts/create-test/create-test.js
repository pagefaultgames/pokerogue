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
const choices = /** @type {const} */ ([
  { label: "Move", dir: "moves" },
  { label: "Ability", dir: "abilities" },
  { label: "Item", dir: "items" },
  { label: "Reward", dir: "rewards" },
  { label: "Mystery Encounter", dir: "mystery-encounter/encounters" },
  { label: "Utils", dir: "utils" },
  // TODO: Uncomment once we can actually test UI code
  //  { label: "UI", dir: "ui" },
]);

/** @typedef {choices[number]} choiceType */
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
 * @returns {Promise<choiceType> the selected type
 */
async function promptTestType() {
  /** @type {choices[number] | {name: "EXIT"}} */
  const typeAnswer = await inquirer
    .prompt([
      {
        type: "list",
        name: "selectedOption",
        message: "What type of test would you like to create?",
        choices: [
          ...choices.map(choice => ({ name: choice.label, value: choice })),
          { name: "EXIT", value: { label: "EXIT" } },
        ],
      },
    ])
    .then(ta => ta.selectedOption);

  if (typeAnswer.name === "EXIT") {
    console.log("Exiting...");
    return process.exit(0);
  }

  return typeAnswer;
}

/**
 * Prompts the user to provide a file name.
 * @param {string} selectedType
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
 * @param {choiceType['label']} choiceType The choice selected
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
  console.group(chalk.grey(`Create Test - v${version}\n`));

  try {
    const type = await promptTestType();
    const fileNameAnswer = await promptFileName(type.label);

    // Convert fileName from snake_case or camelCase to kebab-case
    const fileName = fileNameAnswer
      .replace(/_+/g, "-") // Convert snake_case (underscore) to kebab-case (dashes)
      .replace(/([a-z])([A-Z])/g, "$1-$2") // Convert camelCase to kebab-case
      .replace(/\s+/g, "-") // Replace spaces with dashes
      .toLowerCase(); // Ensure all lowercase
    // Format the description for the test case

    const formattedName = fileName.replace(/-/g, " ").replace(/\b\w/g, char => char.toUpperCase());
    // Determine the directory based on the type
    const dir = getTestFolderPath(type.dir);
    const description = `${type.label} - ${formattedName}`;

    // Define the content template
    const content = fs.readFileSync(getBoilerplatePath(type.label), "utf8").replace("{{description}}", description);

    // Ensure the directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create the file with the given name
    const filePath = path.join(dir, `${fileName}.test.ts`);

    if (fs.existsSync(filePath)) {
      console.error(chalk.red.bold(`\n✗ File "${fileName}.test.ts" already exists!\n`));
      process.exit(1);
    }

    // Write the template content to the file
    fs.writeFileSync(filePath, content, "utf8");

    console.log(chalk.green.bold(`\n✔ File created at: test/${type.dir}/${fileName}.test.ts\n`));
    console.groupEnd();
  } catch (err) {
    console.error(chalk.red("✗ Error: ", err.message));
  }
}

//#endregion
//#region Run

runInteractive();

//#endregion
