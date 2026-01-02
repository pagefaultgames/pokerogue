/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { select } from "@inquirer/prompts";
import { toCamelCase, toTitleCase } from "../../helpers/casing.js";
import { STARTER_OPTIONS } from "../constants.js";
import {
  promptAbilityIndex,
  promptFormIndex,
  promptMoveset,
  promptNature,
  promptSpeciesId,
  promptVariant,
} from "./pokemon.js";

/** @import {Variant} from "./pokemon.js"; */

/**
 * @typedef {{
 *   speciesId?: number,
 *   formIndex?: number,
 *   variant?: Variant,
 *   moveset?: number[],
 *   nature?: number,
 *   abilityIndex?: number,
 * }} StarterConfig
 */

/**
 * Prompt the user to configure the daily run starters.
 * @returns {Promise<StarterConfig[]>} A Promise that resolves with the configured starter Pokemon.
 * @remarks All 3 **must** be configured with at least a SpeciesId.
 */
export async function promptStarters() {
  /** @type {StarterConfig[]} */
  const starters = [];

  async function promptStarter() {
    const speciesId = await promptSpeciesId();
    /** @type {StarterConfig} */
    const starterConfig = { speciesId };
    await promptStarterOptions(starterConfig);
    starters.push(starterConfig);
  }

  while (starters.length < 3) {
    await promptStarter();
  }

  return starters;
}

/**
 * The list of valid options for the current starter.
 */
const starterOptions = [...STARTER_OPTIONS];

/**
 * Prompt the user to configure the individual starter pokemon
 * @param {StarterConfig} starterConfig - The starter config to configure; will be mutated in place
 */
async function promptStarterOptions(starterConfig) {
  if (starterOptions.length === 1) {
    // Only "finish" left
    return;
  }

  const option = /** @type {(typeof starterOptions)[number]} */ (
    toCamelCase(
      await select({
        message: "Please select the starter option you would like to configure.",
        choices: [...starterOptions].map(toTitleCase),
      }),
    )
  );

  switch (option) {
    case "formIndex":
      starterConfig.formIndex = await promptFormIndex();
      break;
    case "variant":
      starterConfig.variant = await promptVariant();
      break;
    case "moveset":
      starterConfig.moveset = await promptMoveset();
      break;
    case "nature":
      starterConfig.nature = await promptNature();
      break;
    case "abilityIndex":
      starterConfig.abilityIndex = await promptAbilityIndex();
      break;
    case "finish":
      // Re-add all used options for next starter
      starterOptions.splice(0, starterOptions.length, ...STARTER_OPTIONS);
      return;
  }
  starterOptions.splice(starterOptions.indexOf(option), 1);
  await promptStarterOptions(starterConfig);
}
