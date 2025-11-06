/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Interactive CLI to create a custom daily run seed.
 * Usage: `pnpm daily-seed` or `node scripts/daily-seed/main.js`
 */

import chalk from "chalk";
import inquirer from "inquirer";
import { promptBoss } from "./prompts/boss.js";
import { promptBiome, promptEdit, promptLuck, promptMoney, promptSeedVariation } from "./prompts/general.js";
import { promptStarters } from "./prompts/starter.js";

/**
 * The version of this script
 * @type {string}
 */
const SCRIPT_VERSION = "1.0.0";

/**
 * @typedef {Object} CustomSeedConfig
 * @property {import("./prompts/starter.js").StarterConfig[]} [starters]
 * @property {import("./prompts/boss.js").BossConfig} [boss]
 * @property {number} [biome]
 * @property {number} [luck]
 * @property {number} [startingMoney]
 * @property {string} [seedVariation]
 */
/**
 * @type {CustomSeedConfig}
 */
const customSeedConfig = {
  starters: undefined,
  boss: undefined,
  biome: undefined,
  luck: undefined,
  startingMoney: undefined,
};

const options = ["starters", "boss", "biome", "luck", "starting money", "seed variation", "edit"];

async function main() {
  if (process.argv.includes("--version") || process.argv.includes("-v")) {
    console.log(`Daily Seed Generator - v${SCRIPT_VERSION}`);
    return process.exit(0);
  }

  if (process.argv.includes("--edit") || process.argv.includes("-e")) {
    const config = await promptEdit();
    Object.assign(customSeedConfig, config);
    options.splice(options.indexOf("edit"), 1);
  }

  console.group(chalk.grey(`🌱 Daily Seed Generator - v${SCRIPT_VERSION}\n`));

  try {
    promptOptions();
  } catch (err) {
    console.error(chalk.red("✗ Error: ", err));
  }
}

function promptOptions() {
  inquirer
    .prompt([
      {
        type: "list",
        name: "selectedConfig",
        message: "Select the config you want to :",
        choices: [...options, "finish", "exit"],
        pageSize: 10,
      },
    ])
    .then(answers => {
      handleAnswer(answers.selectedConfig);
    });
}

/**
 * @param {string} answer
 */
async function handleAnswer(answer) {
  switch (answer) {
    case "finish":
      finish();
      break;
    case "edit": {
      const config = await promptEdit();
      Object.assign(customSeedConfig, config);
      break;
    }
    case "starters":
      customSeedConfig.starters = await promptStarters();
      break;
    case "boss":
      customSeedConfig.boss = await promptBoss();
      break;
    case "biome":
      customSeedConfig.biome = await promptBiome();
      break;
    case "luck":
      customSeedConfig.luck = await promptLuck();
      break;
    case "starting money":
      customSeedConfig.startingMoney = await promptMoney();
      break;
    case "seed variation":
      customSeedConfig.seedVariation = await promptSeedVariation();
      break;
    case "exit":
      console.log(chalk.gray("exiting..."));
      process.exit(0);
  }
  if (answer !== "edit") {
    options.splice(options.indexOf(answer), 1);
  }
  if (options.includes("edit")) {
    // always remove "edit" option
    options.splice(options.indexOf("edit"), 1);
  }
  promptOptions();
}

function finish() {
  console.log(chalk.cyan("\n🌱 Your custom seed config is:"));
  console.log(chalk.green(`${JSON.stringify(customSeedConfig)}`));
  process.exit(0);
}

main();
