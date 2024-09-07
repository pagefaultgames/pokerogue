import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * This script creates a test boilerplate file for a move or ability.
 * @param {string} type - The type of test to create. Either "move", "ability",
 * or "item".
 * @param {string} fileName - The name of the file to create.
 * @example npm run create-test move tackle
 */

// Get the directory name of the current module file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the arguments from the command line
const args = process.argv.slice(2);
const type = args[0]; // "move" or "ability"
let fileName = args[1]; // The file name

if (!type || !fileName) {
    console.error('Please provide both a type ("move", "ability", or "item") and a file name.');
    process.exit(1);
}

// Convert fileName from to snake_case if camelCase is given
fileName = fileName.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();

// Format the description for the test case
const formattedName = fileName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase());

// Determine the directory based on the type
let dir;
let description;
if (type === 'move') {
    dir = path.join(__dirname, 'src', 'test', 'moves');
    description = `Moves - ${formattedName}`;
} else if (type === 'ability') {
    dir = path.join(__dirname, 'src', 'test', 'abilities');
    description = `Abilities - ${formattedName}`;
} else if (type === "item") {
    dir = path.join(__dirname, 'src', 'test', 'items');
    description = `Items - ${formattedName}`;
} else {
    console.error('Invalid type. Please use "move", "ability", or "item".');
    process.exit(1);
}

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

// Define the content template
const content = `import { Abilities } from "#enums/abilities";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, it } from "vitest";

describe("${description}", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(SPLASH_ONLY);
  });

  it("test case", async () => {
    // await game.classicMode.startBattle();
    // game.move.select();
  }, TIMEOUT);
});
`;

// Write the template content to the file
fs.writeFileSync(filePath, content, 'utf8');

console.log(`File created at: ${filePath}`);
