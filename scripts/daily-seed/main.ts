/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/*
 * Interactive CLI to create a custom daily run seed.
 * Usage: `pnpm dailySeed:create`
 */

import { EDIT_OPTIONS } from "#daily-seed/constants";
import { promptBoss } from "#daily-seed/prompts/boss";
import {
  promptBiome,
  promptChallenges,
  promptEdit,
  promptForcedWaves,
  promptLuck,
  promptMoney,
  promptMysteryEncounters,
  promptSeed,
  promptTrainerManipulation,
} from "#daily-seed/prompts/general";
import { promptStarters } from "#daily-seed/prompts/starter";
import { getPropertyValue } from "#script-utils/arguments";
import { promptOverwrite, writeFileSafe } from "#script-utils/file";
import type { CustomDailyRunConfig } from "#types/daily-run";
import { toTitleCase } from "#utils/strings";
import { existsSync } from "fs";
import { join } from "path";
import { select } from "@inquirer/prompts";
import chalk from "chalk";

/**
 * The version of this script
 */
const SCRIPT_VERSION: string = "1.0.0";

const rootDir = join(import.meta.dirname, "..", "..");

/**
 * The config for the custom daily run seed.
 */
const customSeedConfig: CustomDailyRunConfig = {
  seed: "",
};

/**
 * All valid options for editing the config.
 */
const editOptions = [...EDIT_OPTIONS];

type EditOption = (typeof editOptions)[number];

/**
 * Run the `dailySeed:create` script.
 */
async function main(): Promise<void> {
  // TODO: Add help text
  console.group(chalk.grey(`🌱 Daily Seed Generator - v${SCRIPT_VERSION}\n`));

  if (process.argv.includes("--version") || process.argv.includes("-v")) {
    return;
  }

  if (process.argv.includes("--edit") || process.argv.includes("-e")) {
    const config = await promptEdit();
    Object.assign(customSeedConfig, config);
    editOptions.splice(editOptions.indexOf("edit"), 1);
  }

  try {
    // `seed` is required
    customSeedConfig.seed = await promptSeed();
    await promptOptions();
    if (process.exitCode != null) {
      return;
    }
  } catch (err) {
    console.error(chalk.red.bold("✗ Error: ", err));
  }
}

async function promptOptions() {
  const option = await select({
    message: "Please select the option you would like to configure.",
    choices: [...editOptions].map(toTitleCase),
  });
  await handleAnswer(option.toLowerCase() as EditOption);
}

/**
 * Handle the selected option from the main menu.
 * @param answer - The selected answer.
 */
async function handleAnswer(answer: EditOption): Promise<void> {
  switch (answer) {
    case "finish":
      await finish();
      return;
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
    case "forced waves":
      customSeedConfig.forcedWaves = await promptForcedWaves();
      break;
    case "trainer manipulation":
      customSeedConfig.trainerManipulations = await promptTrainerManipulation();
      break;
    case "challenges":
      customSeedConfig.challenges = await promptChallenges();
      break;
    case "mystery encounters":
      customSeedConfig.mysteryEncounters = await promptMysteryEncounters();
      break;
    case "starting money":
      customSeedConfig.startingMoney = await promptMoney();
      break;
    case "seed":
      customSeedConfig.seed = await promptSeed();
      break;
    case "exit":
      console.log(chalk.gray("Exiting..."));
      process.exitCode = 0;
      return;
  }

  if (answer !== "edit") {
    editOptions.splice(editOptions.indexOf(answer), 1);
  }
  if (editOptions.includes("edit")) {
    // always remove "edit" option after first action
    editOptions.splice(editOptions.indexOf("edit"), 1);
  }
  await promptOptions();
}

const OUTFILE_ALIASES = ["-o", "--outfile", "--outFile"] as const;

/**
 * Finish the daily seed configuration process.
 */
async function finish() {
  console.groupEnd();
  // TODO: do we also need to validate here?

  const outFile = getPropertyValue(process.argv.slice(2), OUTFILE_ALIASES);
  if (outFile) {
    console.log(chalk.hex("#ffa500")(`Using outfile: ${chalk.blue(outFile)}`));
    await createOutputFile(outFile);
  } else {
    console.log(
      chalk.hex("#ffa500")("No outfile detected, logging to stdout...")
        + chalk.cyan("\n🌱 Your custom daily seed config is:")
        + chalk.green(`\n${JSON.stringify(customSeedConfig)}`),
    );
  }
}

/**
 * Write the seed config to a file.
 * @param outFile - The output file path
 */
async function createOutputFile(outFile: string): Promise<void> {
  if (!outFile.endsWith(".json")) {
    outFile = `${outFile}.json`;
  }
  try {
    if (existsSync(outFile) && !(await promptOverwrite(outFile))) {
      console.log(chalk.gray("Cancelled."));
      return;
    }
    const fullPath = join(rootDir, outFile);

    writeFileSafe(fullPath, JSON.stringify(customSeedConfig));
    console.log(chalk.green(`✔ Output written to ${chalk.blue(outFile)} successfully!`));
  } catch (err) {
    console.error(chalk.red(`✗ Error while writing output file: ${err}`));
    process.exitCode = 1;
  }
}

await main();
