/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import inquirer from "inquirer";
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
  return await inquirer
    .prompt([
      {
        type: "number",
        name: "speciesId",
        message: "speciesId:\n",
        min: 1,
        max: Math.max(...SPECIES_IDS),
        validate: input => {
          if (!input || !SPECIES_IDS.includes(input)) {
            return "Invalid speciesId";
          }
          return true;
        },
      },
    ])
    .then(async answer => {
      return answer.speciesId;
    });
}

/**
 * Prompts the user to enter a formIndex.
 * @returns {Promise<number>} The formIndex
 * @remarks This does **NOT** validate the formIndex, since we can't access the pokemon data here.
 */
export async function promptFormIndex() {
  return await inquirer
    .prompt([
      {
        type: "number",
        name: "formIndex",
        message: "formIndex:\n",
        min: 0,
      },
    ])
    .then(answer => {
      return answer.formIndex;
    });
}

/**
 * Prompts the user to enter a variant.
 * Must be a number between 0 and 2.
 * @returns {Promise<Variant>} The {@linkcode Variant}
 * @remarks This does **NOT** validate that the variant exists for the given species.
 */
export async function promptVariant() {
  return await inquirer
    .prompt([
      {
        type: "number",
        name: "variant",
        message: "variant:\n",
        min: 0,
        max: 2,
      },
    ])
    .then(answer => {
      return answer.variant;
    });
}

/**
 * Prompts the user to enter a nature.
 * Must be a number between 0 and 24.
 * @returns {Promise<number>} The nature
 */
export async function promptNature() {
  return await inquirer
    .prompt([
      {
        type: "list",
        name: "nature",
        message: "nature:\n",
        choices: [...Object.keys(NATURES)],
        pageSize: 10,
      },
    ])
    .then(answer => {
      return NATURES[/** @type {keyof typeof NATURES} */ (answer.nature)];
    });
}

/**
 * Prompts the user to enter a moveset of up to 4 moves.
 * @returns {Promise<number[]>} The moveset.
 */
export async function promptMoveset() {
  /** @type {number[]} */
  const moveset = [];

  async function addMove() {
    await inquirer
      .prompt([
        {
          type: "number",
          name: "move",
          message: "Add a move to the moveset: (press ENTER to finish)\n",
          min: 1,
          max: MAX_MOVE_ID,
        },
      ])
      .then(async answer => {
        if (!answer.move) {
          return;
        }
        moveset.push(answer.move);
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
  return await inquirer
    .prompt([
      {
        type: "number",
        name: "ability",
        message: `${passive ? "passive" : "ability"} of the boss:\n`,
        min: 1,
        max: MAX_ABILITY_ID,
      },
    ])
    .then(answer => {
      return answer.ability;
    });
}

/**
 * Prompts the user to enter an abilityIndex.
 * Must be a number between 0 and 2.
 * @returns {Promise<number>} The abilityIndex
 * @remarks This is starter only for now.
 */
export async function promptAbilityIndex() {
  return await inquirer
    .prompt([
      {
        type: "number",
        name: "abilityIndex",
        message: "abilityIndex:\n",
        min: 0,
        max: 2,
      },
    ])
    .then(answer => {
      return answer.abilityIndex;
    });
}
