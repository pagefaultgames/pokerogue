/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { input, number, select } from "@inquirer/prompts";
import { Ajv } from "ajv";
import chalk from "chalk";
import customDailyRunSchema from "../../../src/data/daily-seed/schema.json" with { type: "json" };
import { toTitleCase, toUpperSnakeCase } from "../../helpers/casing.js";
import { BIOMES } from "../constants.js";
import { promptSpeciesId } from "./pokemon.js";

/**
 * @typedef {{
 *   waveIndex: number,
 *   speciesId: number,
 * }} ForcedWaveConfig
 */

const ajv = new Ajv({
  allErrors: true,
});

/**
 * The validator for the {@linkcode CustomDailyRunConfig}.
 */
const validate = ajv.compile(customDailyRunSchema);

/**
 * Prompt the user to enter a starting money value.
 * @returns {Promise<number>} A Promise that resolves with the starting money value.
 */
export async function promptMoney() {
  return await number({
    message: "Please enter the starting money value to set.",
    default: 1000,
    min: 0,
    required: true,
  });
}

/**
 * Prompt the user to enter a starting luck value.
 * Must be a number between 0 and 14.
 * @returns {Promise<number>} A Promise that resolves with the chosen luck value.
 */
export async function promptLuck() {
  return await number({
    message: "Please enter the initial luck value to set.",
    min: 0,
    max: 14,
    required: true,
  });
}

/**
 * Prompt the user to enter a starting biome.
 * @returns {Promise<number>} A Promise that resolves with the chosen biome.
 */
export async function promptBiome() {
  const biome = await select({
    message: "Please enter the starting biome to set.",
    choices: [...Object.keys(BIOMES).map(toTitleCase)],
    pageSize: 10,
  });
  return BIOMES[/** @type {keyof typeof BIOMES} */ (toUpperSnakeCase(biome))];
}

/**
 * Prompt the user to enter a custom config.
 * The input is a JSON stringified version of the {@linkcode CustomSeedConfig} object.
 * @returns {Promise<import("../main.js").CustomSeedConfig>} A Promise that resolves with the parsed {@linkcode CustomSeedConfig}.
 */
export async function promptEdit() {
  const config = await input({
    message: chalk.blue("Enter a custom config to use."),
    validate: value => {
      try {
        const parsed = JSON.parse(value);

        if (!validate(parsed)) {
          return (
            chalk.red.bold("Invalid config file specified!\n")
            + validate.errors?.map(e => `${e.instancePath} ${e.message}`).join("\n")
          );
        }

        return true;
      } catch {
        if (value.trim() === "") {
          return true;
        }
        return chalk.red.bold("Invalid JSON!");
      }
    },
  });

  if (config.trim() === "") {
    return {};
  }
  return JSON.parse(config);
}

/**
 * Prompt the user to enter a seed.
 * This can be anything and is used as the actual daily run seed.
 * @returns {Promise<string>} A Promise that resolves with the chosen seed.
 */
export async function promptSeed() {
  return await input({
    message: "Please enter seed.",
    validate: value => {
      if (value.trim() === "") {
        return chalk.red.bold("Seed cannot be empty!");
      }
      return true;
    },
  });
}

/**
 * Prompt the user to enter a list of forced waves.
 * @returns {Promise<ForcedWaveConfig[] | undefined>} A Promise that resolves with the list of forced waves.
 */
export async function promptForcedWaves() {
  /** @type {ForcedWaveConfig[]} */
  const forcedWaves = [];

  async function addForcedWave() {
    const waveIndex = await number({
      message: "Please enter the wave to force.\nPressing ENTER will end the prompt early.",
      min: 1,
      max: 49,
      validate: value => {
        if (forcedWaves.some(wave => wave.waveIndex === value)) {
          return chalk.red.bold("Wave already forced!");
        }
        return true;
      },
    });
    if (!waveIndex) {
      return;
    }
    const speciesId = await promptSpeciesId();
    forcedWaves.push({ waveIndex, speciesId });
    await addForcedWave();
  }

  await addForcedWave();
  if (forcedWaves.length === 0) {
    return;
  }
  return forcedWaves;
}
