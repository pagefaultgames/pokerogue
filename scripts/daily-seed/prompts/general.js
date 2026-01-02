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

const ajv = new Ajv({
  allErrors: true,
});
/**
 * The validator for the {@linkcode CustomDailyRunConfig}.
 */
const validate = ajv.compile(customDailyRunSchema);

/**
 * Prompt the user to enter a starting money value.
 * @returns {Promise<number>} The starting money value.
 */
export async function promptMoney() {
  return await number({
    message: "Please enter starting money amount.",
    default: 1000,
    min: 0,
    required: true,
  });
}

/**
 * Prompt the user to enter a daily run luck value.
 * Must be a number between 0 and 14.
 * @returns {Promise<number>} The luck value.
 */
export async function promptLuck() {
  return await number({
    message: "Please enter initial luck value.",
    min: 0,
    max: 14,
    required: true,
  });
}

/**
 * Prompt the user to enter a starting biome.
 * @returns {Promise<number>} The starting biome number.
 */
export async function promptBiome() {
  const biome = /** @type {string} */ (
    await select({
      message: "Please enter starting biome.",
      choices: [...Object.keys(BIOMES).map(toTitleCase)],
      pageSize: 10,
    })
  );
  return BIOMES[/** @type {keyof typeof BIOMES} */ (toUpperSnakeCase(biome))];
}

/**
 * Prompt the user to enter a custom config.
 * The input is a JSON stringified version of the {@linkcode CustomSeedConfig} object.
 * @returns {Promise<import("../main.js").CustomSeedConfig>} The parsed {@linkcode CustomSeedConfig}.
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
 * @returns {Promise<string>} The seed.
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
