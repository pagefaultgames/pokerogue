/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { confirm, input, number, search, select } from "@inquirer/prompts";
import { Ajv } from "ajv";
import chalk from "chalk";
import customDailyRunSchema from "../../../src/data/daily-seed/schema.json" with { type: "json" };
import { BIOMES } from "../../enums/biomes.js";
import { toTitleCase, toUpperSnakeCase } from "../../helpers/casing.js";
import { BIOME_POOL_TIERS } from "../constants.js";
import { promptSpeciesId } from "./pokemon.js";

/**
 * @typedef {{
 *   waveIndex: number,
 *   speciesId: number,
 *   hiddenAbility?: boolean,
 * } | {
 *   waveIndex: number,
 *   tier: number,
 *   hiddenAbility?: boolean,
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
  const biomeName = await search({
    message: "Please enter the starting biome to set.",
    source: term => {
      const biomes = Object.keys(BIOMES).map(toTitleCase);
      if (!term) {
        return biomes;
      }
      return biomes.filter(id => id.toLowerCase().includes(term.toLowerCase()));
    },
  });
  const biomeId = BIOMES[/** @type {keyof typeof BIOMES} */ (toUpperSnakeCase(biomeName))];
  return biomeId;
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

    const hiddenAbility = await confirm({
      message: "Should the forced wave have the hidden ability?",
      default: false,
    });

    /** @type {"Species" | "Tier"} */
    const type = await select({
      message: "Please select the type of wave to force.",
      choices: ["Species", "Tier"],
    });
    switch (type) {
      case "Species": {
        const speciesId = await promptSpeciesId();
        forcedWaves.push({ waveIndex, speciesId, hiddenAbility: hiddenAbility ? true : undefined });
        break;
      }
      case "Tier": {
        const poolTier = await select({
          message: "Please select the pool tier to force.",
          choices: [...Object.keys(BIOME_POOL_TIERS).map(toTitleCase)],
          pageSize: 10,
        });
        forcedWaves.push({
          waveIndex,
          tier: BIOME_POOL_TIERS[/** @type {keyof typeof BIOME_POOL_TIERS} */ (toUpperSnakeCase(poolTier))],
          hiddenAbility: hiddenAbility ? true : undefined,
        });
        break;
      }
    }
    await addForcedWave();
  }

  await addForcedWave();
  if (forcedWaves.length === 0) {
    return;
  }
  return forcedWaves;
}
