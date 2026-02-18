/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { number, search } from "@inquirer/prompts";
import { ABILITIES } from "../../enums/abilities.js";
import { MOVES } from "../../enums/moves.js";
import { NATURES } from "../../enums/natures.js";
import { SPECIES } from "../../enums/species.js";
import { toTitleCase, toUpperSnakeCase } from "../../helpers/casing.js";

/**
 * @typedef {0 | 1 | 2} Variant
 */

/**
 * Prompt the user to enter a speciesId.
 * @see {@linkcode SPECIES_IDS} for a list of valid `SpeciesId`s.
 * @returns {Promise<number>} A Promise that resolves with the chosen `SpeciesId`.
 */
export async function promptSpeciesId() {
  const speciesName = await search({
    message: "Please enter the SpeciesId to set.",
    source: term => {
      const species = Object.keys(SPECIES).map(toTitleCase);
      if (!term) {
        return species;
      }
      return species.filter(id => id.toLowerCase().includes(term.toLowerCase()));
    },
  });
  const speciesId = SPECIES[/** @type {keyof typeof SPECIES} */ (toUpperSnakeCase(speciesName))];
  return speciesId;
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
  const natureName = await search({
    message: "Please enter the nature to set.",
    source: term => {
      const natures = Object.keys(NATURES).map(toTitleCase);
      if (!term) {
        return natures;
      }
      return natures.filter(id => id.toLowerCase().includes(term.toLowerCase()));
    },
  });
  const natureId = NATURES[/** @type {keyof typeof NATURES} */ (toUpperSnakeCase(natureName))];
  return natureId;
}

/**
 * Prompt the user to enter a moveset of up to 4 moves.
 * @returns {Promise<number[]>} A Promise that resolves with the chosen moveset.
 */
export async function promptMoveset() {
  /** @type {number[]} */
  const moveset = [];

  async function addMove() {
    const moveName = await search({
      message:
        "Please enter the move to add to the moveset.\nPressing ENTER with 'None' selected will end the prompt early.",
      source: term => {
        const moves = Object.keys(MOVES).map(toTitleCase);
        if (!term) {
          return moves;
        }
        return moves.filter(id => id.toLowerCase().includes(term.toLowerCase()));
      },
      validate: value => {
        const moveId = MOVES[/** @type {keyof typeof MOVES} */ (toUpperSnakeCase(value))];
        if (moveset.includes(moveId)) {
          return "Move already in moveset!";
        }
        return true;
      },
    });
    const moveId = MOVES[/** @type {keyof typeof MOVES} */ (toUpperSnakeCase(moveName))];

    if (!moveId) {
      return;
    }
    moveset.push(moveId);
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
  const abilityName = await search({
    message: `Please enter the ${passive ? "passive" : "normal"} ability of the final boss.`,
    source: term => {
      const abilities = Object.keys(ABILITIES).map(toTitleCase);
      if (!term) {
        return abilities;
      }
      return abilities.filter(id => id.toLowerCase().includes(term.toLowerCase()));
    },
  });
  const abilityId = ABILITIES[/** @type {keyof typeof ABILITIES} */ (toUpperSnakeCase(abilityName))];
  return abilityId;
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
