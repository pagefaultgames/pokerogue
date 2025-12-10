/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { number, select } from "@inquirer/prompts";
import chalk from "chalk";
import { toTitleCase, toUpperSnakeCase } from "../../helpers/casing.js";
import { MAX_ABILITY_ID, MAX_MOVE_ID, NATURES, SPECIES_IDS } from "../constants.js";

/**
 * @typedef {0 | 1 | 2} Variant
 */

/**
 * Prompts the user to enter a speciesId.
 * @see {@linkcode SPECIES_IDS} for a list of valid speciesIds.
 * @returns {Promise<number>}
 */
export async function promptSpeciesId() {
  return await number({
    message: "Please enter the SpeciesId to set.",
    min: 1,
    max: Math.max(...SPECIES_IDS),
    required: true,
    validate: input => {
      if (!input || !SPECIES_IDS.includes(input)) {
        return chalk.red.bold("Invalid SpeciesId specified!");
      }
      return true;
    },
  });
}

/**
 * Prompts the user to enter a formIndex.
 * @returns {Promise<number>} The formIndex
 * @remarks This does **NOT** validate the formIndex, since we can't access the pokemon data here.
 */
export async function promptFormIndex() {
  return await number({
    message: "Please enter the form index to set.",
    min: 0,
    required: true,
  });
}

/**
 * Prompts the user to enter a variant.
 * Must be a number between 0 and 2.
 * @returns {Promise<Variant>} The {@linkcode Variant}
 * @remarks This does **NOT** validate that the variant exists for the given species.
 */
export async function promptVariant() {
  return /** @type {Variant} */ (
    await number({
      message: "Please enter the variant to set.",
      min: 0,
      max: 2,
      required: true,
    })
  );
}

/**
 * Prompts the user to enter a nature.
 * Must be a number between 0 and 24.
 * @returns {Promise<number>} The nature
 */
export async function promptNature() {
  const nature = /** @type {string} */ (
    await select({
      message: "Please enter the nature to set.",
      choices: [...Object.keys(NATURES).map(toTitleCase)],
      pageSize: 10,
    })
  );
  return NATURES[/** @type {keyof typeof NATURES} */ (toUpperSnakeCase(nature))];
}

/**
 * Prompts the user to enter a moveset of up to 4 moves.
 * @returns {Promise<number[]>} The moveset.
 */
export async function promptMoveset() {
  /** @type {number[]} */
  const moveset = [];

  async function addMove() {
    await number({
      message: "Please enter the move to add to the moveset.\nPressing ENTER will end the prompt early.",
      min: 1,
      max: MAX_MOVE_ID,
    }).then(async move => {
      if (!move) {
        return;
      }
      moveset.push(move);
      if (moveset.length < 4) {
        await addMove();
      }
    });
  }

  await addMove();
  return moveset;
}

/**
 * Prompts the user to enter an ability.
 * @param {boolean} [passive=false] Whether to prompt for a passive ability.
 * @returns {Promise<number>} The abilityId
 * @remarks This is boss only for now, since the option for setting any ability is not yet implemented.
 */
export async function promptAbility(passive = false) {
  return await number({
    message: `Please enter the ${passive ? "passive" : "normal"} ability of the final boss.`,
    min: 1,
    max: MAX_ABILITY_ID,
    required: true,
  });
}

/**
 * Prompts the user to enter an abilityIndex.
 * Must be a number between 0 and 2.
 * @returns {Promise<number>} The abilityIndex
 * @remarks This is starter only for now.
 */
export async function promptAbilityIndex() {
  return await number({
    message: `Please enter the starter's ability index.`,
    min: 0,
    max: 2,
    required: true,
  });
}
