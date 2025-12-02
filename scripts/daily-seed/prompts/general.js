/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { input, number, select } from "@inquirer/prompts";
import { Ajv } from "ajv";
import customDailyRunSchema from "../../../src/data/daily-seed/schema.json" with { type: "json" };
import { BIOMES } from "../constants.js";

const ajv = new Ajv({
  allErrors: true,
});
const validate = ajv.compile(customDailyRunSchema);

/**
 * Prompts the user to enter a starting money value.
 * @returns {Promise<number>} The starting money value.
 */
export async function promptMoney() {
  return await number({
    message: "starting money (press TAB to edit the placeholder):",
    default: 1000,
    min: 0,
    required: true,
  });
}

/**
 * Prompts the user to enter a daily run luck value.
 * Must be a number between 0 and 14.
 * @returns {Promise<number>} The luck value.
 */
export async function promptLuck() {
  return await number({
    message: "Daily run luck:",
    min: 0,
    max: 14,
    required: true,
  });
}

/**
 * Prompts the user to enter a starting biome.
 * @returns {Promise<number>} The starting biome number.
 */
export async function promptBiome() {
  const biome = await select({
    message: "Starting biome:",
    choices: [...Object.keys(BIOMES)],
    pageSize: 10,
  });
  return BIOMES[/** @type {keyof typeof BIOMES} */ (biome)];
}

/**
 * Prompts the user to enter a custom config.
 * The input is a JSON stringified version of the {@linkcode CustomSeedConfig} object.
 * @returns {Promise<import("../main.js").CustomSeedConfig>} The parsed {@linkcode CustomSeedConfig}.
 * @remarks The input is not validated.
 */
export async function promptEdit() {
  return await input({
    message: "The stringified config to edit:",
    validate: value => {
      try {
        const config = JSON.parse(value);

        if (!validate(config)) {
          return "Invalid config:\n" + validate.errors?.map(e => `${e.instancePath} ${e.message}`).join("\n");
        }

        return true;
      } catch {
        if (value.trim() === "") {
          return true;
        }
        return "Invalid JSON";
      }
    },
  }).then(config => {
    if (config.trim() === "") {
      return {};
    }
    return JSON.parse(config);
  });
}

/**
 * Prompts the user to enter a seed variation.
 * This can be anything and is only used to \
 * differentiate between multiple seeds with the same config.
 * @returns {Promise<string>} The seed variation.
 */
export async function promptSeedVariation() {
  return await input({
    message: "Seed variation:",
    validate: value => {
      if (value.trim() === "") {
        return "Seed variation cannot be empty!";
      }
      return true;
    },
  });
}
