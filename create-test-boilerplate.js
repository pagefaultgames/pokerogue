/**
 * This script creates a test boilerplate file in the appropriate 
 * directory based on the type selected.
 * @example npm run create-test
 */

import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const typeChoices = ["Move", "Ability", "Item", "Mystery Encounter"];

/**
 * Prompts the user to select a type via list.
 * @returns {Promise<{selectedOption: string}>} the selected type
 */
async function promptTestType() {
  const typeAnswer = await inquirer.prompt([
    {
      type: "list",
      name: "selectedOption",
      message: "What type of test would you like to create:",
      choices: [...typeChoices, "EXIT"],
    },
  ]);

  if (typeAnswer.selectedOption === "EXIT") {
    console.log("Exiting...");
    return process.exit();
  } else if (!typeChoices.includes(typeAnswer.selectedOption)) {
    console.error(`Please provide a valid type (${typeChoices.join(", ")})!`);
    return await promptTestType();
  }

  return typeAnswer;
}

/**
 * Prompts the user to provide a file name.
 * @param {string} selectedType
 * @returns {Promise<{userInput: string}>} the selected file name
 */
async function promptFileName(selectedType) {
  const fileNameAnswer = await inquirer.prompt([
    {
      type: "input",
      name: "userInput",
      message: `Please provide a file name for the ${selectedType} test:`,
    },
  ]);

  if (!fileNameAnswer.userInput || fileNameAnswer.userInput.trim().length === 0) {
    console.error("Please provide a valid file name!");
    return await promptFileName(selectedType);
  }

  return fileNameAnswer;
}

/**
 * Runs the interactive create-test "CLI"
 * @returns {Promise<void>}
 */
async function runInteractive() {
  const typeAnswer = await promptTestType();
  const fileNameAnswer = await promptFileName(typeAnswer.selectedOption);

  const type = typeAnswer.selectedOption.toLowerCase();
  // Convert fileName from kebab-case or camelCase to snake_case
  const fileName = fileNameAnswer.userInput
    .replace(/-+/g, "_") // Convert kebab-case (dashes) to underscores
    .replace(/([a-z])([A-Z])/g, "$1_$2") // Convert camelCase to snake_case
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .toLowerCase(); // Ensure all lowercase
  // Format the description for the test case

  const formattedName = fileName.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  // Determine the directory based on the type
  let dir;
  let description;
  switch (type) {
    case "move":
      dir = path.join(__dirname, "src", "test", "moves");
      description = `Moves - ${formattedName}`;
      break;
    case "ability":
      dir = path.join(__dirname, "src", "test", "abilities");
      description = `Abilities - ${formattedName}`;
      break;
    case "item":
      dir = path.join(__dirname, "src", "test", "items");
      description = `Items - ${formattedName}`;
      break;
    case "mystery encounter":
      dir = path.join(__dirname, "src", "test", "mystery-encounter", "encounters");
      description = `Mystery Encounter - ${formattedName}`;
      break;
    default:
      console.error(`Invalid type. Please use one of the following: ${typeChoices.join(", ")}.`);
      process.exit(1);
  }

  // Define the content template
  const content = `import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it, expect } from "vitest";

describe("${description}", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset([Moves.SPLASH])
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("test case", async () => {
    // await game.classicMode.startBattle([Species.MAGIKARP]);
    // game.move.select(Moves.SPLASH);
  });
});
`;

  // Ensure the directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Create the file with the given name
  const filePath = path.join(dir, `${fileName}.test.ts`);

  if (fs.existsSync(filePath)) {
    console.error(`File "${fileName}.test.ts" already exists.`);
    process.exit(1);
  }

  // Write the template content to the file
  fs.writeFileSync(filePath, content, "utf8");

  console.log(`File created at: ${filePath}`);
}

runInteractive();
