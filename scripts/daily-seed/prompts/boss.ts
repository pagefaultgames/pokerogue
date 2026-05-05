/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { BOSS_OPTIONS } from "#daily-seed/constants";
import {
  promptAbility,
  promptFormIndex,
  promptMoveset,
  promptNature,
  promptSegments,
  promptSpeciesId,
  promptVariant,
  type Variant,
} from "#daily-seed/prompts/pokemon";
import { toCamelCase, toTitleCase } from "#utils/strings";
import { confirm, select } from "@inquirer/prompts";
import chalk from "chalk";

/** The config for a single Boss Pokemon. */
export type BossConfig = {
  speciesId?: number;
  formIndex?: number;
  variant?: Variant;
  moveset?: number[];
  nature?: number;
  ability?: number;
  passive?: number;
  segments?: number;
  catchable?: boolean;
};

/**
 * The config for the daily run boss.
 */
let bossConfig: BossConfig = {};

/**
 * Prompt the user to configure the daily run boss.
 * @returns A Promise that resolves with the updated {@linkcode BossConfig | boss configuration}.
 * @remarks The boss **must** be configured with at least a `SpeciesId`.
 */
export async function promptBoss(): Promise<BossConfig> {
  const speciesId = await promptSpeciesId();
  bossConfig = { speciesId };
  return await promptBossOptions();
}

/**
 * The list of valid options for the final boss.
 */
const bossOptions = [...BOSS_OPTIONS];

/**
 * Prompt the user to configure the boss pokemon.
 * @returns A Promise that resolves with the updated {@linkcode BossConfig | boss configuration}.
 */
async function promptBossOptions(): Promise<BossConfig> {
  if (bossOptions.length === 1) {
    return bossConfig;
  }
  const option = toCamelCase(
    await select({
      message: chalk.blue("Please select the final boss option you would like to configure."),
      choices: [...bossOptions].map(toTitleCase),
    }),
  ) as (typeof bossOptions)[number];

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
    case "segments":
      bossConfig.segments = await promptSegments();
      break;
    case "catchable":
      bossConfig.catchable = await confirm({
        message: "Should the boss be catchable?",
        default: false,
      });
      break;
    case "finish":
      return bossConfig;
  }
  bossOptions.splice(bossOptions.indexOf(option), 1);
  return await promptBossOptions();
}
