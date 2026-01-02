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
 * Prompt the user to enter a speciesId.
 * @see {@linkcode SPECIES_IDS} for a list of valid `SpeciesId`s.
 * @returns {Promise<number>} A Promise that resolves with the chosen `SpeciesId`.
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
 * Prompt the user to enter a form index.
 * @returns {Promise<number>} A Promise that resolves with the chosen form index.
 */
// TODO: Validate the form indices based on the selected species if/when project references allow us to import main repo code
export async function promptFormIndex() {
  return await number({
    message: "Please enter the form index to set.",
    min: 0,
    required: true,
  });
}

/**
 * Prompt the user to enter a variant.
 * @returns {Promise<Variant>} A Promise that resolves with the chosen variant.
 * @remarks
 * This does **NOT** validate that the variant exists for the given species.
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
 * Prompt the user to enter a nature.
 * @returns {Promise<number>} A Promise that resolves with the chosen nature.
 */
export async function promptNature() {
  const nature = await select({
    message: "Please enter the nature to set.",
    choices: [...Object.keys(NATURES).map(toTitleCase)],
    pageSize: 10,
  });
  return NATURES[/** @type {keyof typeof NATURES} */ (toUpperSnakeCase(nature))];
}

/**
 * Prompt the user to enter a moveset of up to 4 moves.
 * @returns {Promise<number[]>} A Promise that resolves with the chosen moveset.
 */
export async function promptMoveset() {
  /** @type {number[]} */
  const moveset = [];

  async function addMove() {
    const move = await number({
      message: "Please enter the move to add to the moveset.\nPressing ENTER will end the prompt early.",
      min: 1,
      max: MAX_MOVE_ID,
    });
    if (!move) {
      return;
    }
    moveset.push(move);
    if (moveset.length < 4) {
      await addMove();
    }
  }

  await addMove();
  return moveset;
}

/**
 * Prompt the user to enter an ability.
 * @param {boolean} [passive=false] (Default `false`) Whether to prompt for a passive ability.
 * @returns {Promise<number>} A Promise that resolves with the chosen ability.
 * @remarks
 * This is boss only for now, since the option for setting any ability is not yet implemented.
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
 * Prompt the user to enter an ability index.
 * @returns {Promise<number>} A Promise that resolves with the chosen ability index.
 * @remarks This is starter only for now.
 */
// TODO: Validate the ability index & list the actual ability names based on main repo data
export async function promptAbilityIndex() {
  return await number({
    message: `Please enter the starter's ability index.`,
    min: 0,
    max: 2,
    required: true,
  });
}
