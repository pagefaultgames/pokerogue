/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { select } from "@inquirer/prompts";
import { STARTER_OPTIONS } from "../constants.js";
import {
  promptAbilityIndex,
  promptFormIndex,
  promptMoveset,
  promptNature,
  promptSpeciesId,
  promptVariant,
} from "./pokemon.js";

/**
 * @typedef {Object} StarterConfig
 * @property {number} speciesId
 * @property {number} [formIndex]
 * @property {import("./pokemon.js").Variant} [variant]
 * @property {number[]} [moveset]
 * @property {number} [nature]
 * @property {number} [abilityIndex]
 */

/**
 * Prompts the user to configure the daily run starters.
 * @returns {Promise<StarterConfig[]>}
 * @remarks All 3 **must** be configured with at least a speciesId.
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

const starterOptions = [...STARTER_OPTIONS];

/**
 * Prompts the user to configure the individual starter pokemon
 * @param {StarterConfig} starterConfig
 */
async function promptStarterOptions(starterConfig) {
  await select({
    message: "Select the option you want to configure:",
    choices: [...starterOptions],
  }).then(async answer => {
    switch (answer.option) {
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
    starterOptions.splice(starterOptions.indexOf(answer.option), 1);
    await promptStarterOptions(starterConfig);
  });
}
