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
} from "#daily-seed/prompts/pokemon";
import type { DailySeedBoss } from "#types/daily-run";
import { toCamelCase, toTitleCase } from "#utils/strings";
import { confirm, select } from "@inquirer/prompts";
import chalk from "chalk";

/**
 * Prompt the user to configure the daily run boss.
 * @returns A Promise that resolves with the updated {@linkcode DailySeedBoss | boss configuration}.
 * @remarks The boss **must** be configured with at least a `SpeciesId`.
 */
export async function promptBoss(): Promise<DailySeedBoss> {
  const speciesId = await promptSpeciesId();
  const bossConfig: DailySeedBoss = { speciesId };
  return await promptBossOptions(bossConfig);
}

/**
 * The list of valid options for the final boss.
 */
const bossOptions = [...BOSS_OPTIONS];

/**
 * Prompt the user to configure the boss pokemon.
 * @returns A Promise that resolves with the updated {@linkcode DailySeedBoss | boss configuration}.
 */
async function promptBossOptions(bossConfig: DailySeedBoss): Promise<DailySeedBoss> {
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
  return await promptBossOptions(bossConfig);
}
