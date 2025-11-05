/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import inquirer from "inquirer";
import { BOSS_OPTIONS } from "../constants.js";
import {
  promptAbility,
  promptFormIndex,
  promptMoveset,
  promptNature,
  promptSpeciesId,
  promptVariant,
} from "./pokemon.js";

/**
 * @typedef {Object} BossConfig
 * @property {number} [speciesId]
 * @property {number} [formIndex]
 * @property {import("./pokemon.js").Variant} [variant]
 * @property {number[]} [moveset]
 * @property {number} [nature]
 * @property {number} [ability]
 * @property {number} [passive]
 */
/**
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
 * Prompts the user to configure the daily run boss.
 * @returns {Promise<BossConfig>} The {@linkcode BossConfig}
 * @remarks The boss **must** be configured with at least a speciesId.
 */
export async function promptBoss() {
  const speciesId = await promptSpeciesId();
  bossConfig = { speciesId };
  return await promptBossOptions();
}

const bossOptions = [...BOSS_OPTIONS];

/**
 * Prompts the user to configure the boss pokemon.
 * @returns {Promise<BossConfig>}
 */
async function promptBossOptions() {
  return await inquirer
    .prompt([
      {
        type: "list",
        name: "option",
        message: "Select the option you want to configure:",
        choices: [...bossOptions],
      },
    ])
    .then(async answer => {
      switch (answer.option) {
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
      bossOptions.splice(bossOptions.indexOf(answer.option), 1);
      return await promptBossOptions();
    });
}
