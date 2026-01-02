/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { select } from "@inquirer/prompts";
import chalk from "chalk";
import { toCamelCase, toTitleCase } from "../../helpers/casing.js";
import { BOSS_OPTIONS } from "../constants.js";
import {
  promptAbility,
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
 *   ability?: number,
 *   passive?: number
 * }} BossConfig - The config for a single boss pokemon.
 *
 */

/**
 * The config for the daily run boss.
 * @type {BossConfig}
 */
let bossConfig = {
  speciesId: undefined,
  formIndex: undefined,
  variant: undefined,
  moveset: undefined,
  nature: undefined,
  ability: undefined,
  passive: undefined,
};

/**
 * Prompt the user to configure the daily run boss.
 * @returns {Promise<BossConfig>} The {@linkcode BossConfig}
 * @remarks The boss **must** be configured with at least a SpeciesId.
 */
export async function promptBoss() {
  const speciesId = await promptSpeciesId();
  bossConfig = { speciesId };
  return await promptBossOptions();
}

/**
 * The list of valid options for the final boss.
 * @type {string[]}
 */
const bossOptions = [...BOSS_OPTIONS];

/**
 * Prompt the user to configure the boss pokemon.
 * @returns {Promise<BossConfig>}
 */
async function promptBossOptions() {
  if (bossOptions.length === 1) {
    return bossConfig;
  }
  const option = toCamelCase(
    /** @type {string} */ (
      await select({
        message: chalk.blue("Please select the final boss option you would like to configure."),
        choices: [...bossOptions].map(toTitleCase),
      })
    ),
  );

  switch (option) {
    case "formIndex":
      bossConfig.formIndex = await promptFormIndex();
      break;
    case "variant":
      bossConfig.variant = await promptVariant();
      break;
    case "moveset":
      bossConfig.moveset = await promptMoveset();
      break;
    case "nature":
      bossConfig.nature = await promptNature();
      break;
    case "ability":
      bossConfig.ability = await promptAbility();
      break;
    case "passive":
      bossConfig.passive = await promptAbility(true);
      break;
    case "finish":
      return bossConfig;
  }
  bossOptions.splice(bossOptions.indexOf(option), 1);
  return await promptBossOptions();
}
