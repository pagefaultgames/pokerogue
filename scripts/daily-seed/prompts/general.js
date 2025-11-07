/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Ajv } from "ajv";
import inquirer from "inquirer";
import { BIOMES } from "../constants.js";
import { customDailyRunSchema } from "../schema.js";

const ajv = new Ajv({
  allErrors: true,
});
const validate = ajv.compile(customDailyRunSchema);

/**
 * Prompts the user to enter a starting money value.
 * @returns {Promise<number>} The starting money value.
 */
export async function promptMoney() {
  return await inquirer
    .prompt([
      {
        type: "number",
        name: "startingMoney",
        message: "starting money (press TAB to edit the placeholder):\n",
        default: 1000,
        min: 0,
      },
    ])
    .then(answer => {
      return answer.startingMoney;
    });
}

/**
 * Prompts the user to enter a daily run luck value.
 * Must be a number between 0 and 14.
 * @returns {Promise<number>} The luck value.
 */
export async function promptLuck() {
  return await inquirer
    .prompt([
      {
        type: "number",
        name: "luck",
        message: "Daily run luck:\n",
        min: 0,
        max: 14,
      },
    ])
    .then(answer => {
      return answer.luck;
    });
}

/**
 * Prompts the user to enter a starting biome.
 * @returns {Promise<number>} The starting biome number.
 */
export async function promptBiome() {
  return await inquirer
    .prompt([
      {
        type: "list",
        name: "startingBiome",
        message: "Starting biome:\n",
        choices: [...Object.keys(BIOMES)],
        pageSize: 10,
      },
    ])
    .then(answer => {
      return BIOMES[/** @type {keyof typeof BIOMES} */ (answer.startingBiome)];
    });
}

/**
 * Prompts the user to enter a custom config.
 * The input is a JSON stringified version of the {@linkcode CustomSeedConfig} object.
 * @returns {Promise<import("../main.js").CustomSeedConfig>} The parsed {@linkcode CustomSeedConfig}.
 * @remarks The input is not validated.
 */
export async function promptEdit() {
  return await inquirer
    .prompt([
      {
        type: "input",
        name: "config",
        message: "The stringified config to edit:\n",
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
      },
    ])
    .then(answer => {
      if (answer.config.trim() === "") {
        return {};
      }
      return JSON.parse(answer.config);
    });
}

/**
 * Prompts the user to enter a seed variation.
 * This can be anything and is only used to \
 * differentiate between multiple seeds with the same config.
 * @returns {Promise<string>} The seed variation.
 */
export async function promptSeedVariation() {
  return await inquirer
    .prompt([
      {
        type: "input",
        name: "seedVariation",
        message: "Seed variation:\n",
        validate: value => {
          if (value.trim() === "") {
            return "Seed variation cannot be empty!";
          }
          return true;
        },
      },
    ])
    .then(answer => {
      return answer.seedVariation;
    });
}
