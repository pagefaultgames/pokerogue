/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { STARTER_OPTIONS } from "#daily-seed/constants";
import {
  promptAbility,
  promptFormIndex,
  promptMoveset,
  promptNature,
  promptSpeciesId,
  promptVariant,
} from "#daily-seed/prompts/pokemon";
import type { DailySeedStarter, DailySeedStarterTuple } from "#types/daily-run";
import { toCamelCase, toTitleCase } from "#utils/strings";
import { number, select } from "@inquirer/prompts";

/**
 * Prompt the user to configure the daily run starters.
 * @returns A Promise that resolves with the configured starter Pokemon.
 * @remarks All 3 **must** be configured with at least a SpeciesId.
 */
export async function promptStarters(): Promise<DailySeedStarterTuple> {
  const numStarters = await number({
    message: "Please enter the number of starters.",
    min: 1,
    max: 6,
    required: true,
    default: 3,
  });

  const starters: DailySeedStarter[] = [];

  async function promptStarter() {
    const speciesId = await promptSpeciesId();
    const starterConfig: DailySeedStarter = { speciesId };
    await promptStarterOptions(starterConfig);
    starters.push(starterConfig);
  }

  while (starters.length < numStarters) {
    await promptStarter();
  }

  return starters as DailySeedStarterTuple;
}

/**
 * The list of valid options for the current starter.
 */
const starterOptions = [...STARTER_OPTIONS];

/**
 * Prompt the user to configure the individual starter pokemon
 * @param starterConfig - The starter config to configure; will be mutated in place
 */
async function promptStarterOptions(starterConfig: DailySeedStarter): Promise<void> {
  if (starterOptions.length === 1) {
    // Only "finish" left
    return;
  }

  const option = toCamelCase(
    await select({
      message: "Please select the starter option you would like to configure.",
      choices: [...starterOptions].map(toTitleCase),
    }),
  ) as (typeof starterOptions)[number];

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
    case "ability":
      starterConfig.ability = await promptAbility();
      break;
    case "passive":
      starterConfig.passive = await promptAbility(true);
      break;
    case "finish":
      // Re-add all used options for next starter
      starterOptions.splice(0, starterOptions.length, ...STARTER_OPTIONS);
      return;
  }
  starterOptions.splice(starterOptions.indexOf(option), 1);
  await promptStarterOptions(starterConfig);
}
