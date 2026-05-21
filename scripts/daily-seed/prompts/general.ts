/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { BiomeId } from "#enums/biome-id";
import { BiomePoolTier as BIOME_POOL_TIERS } from "#enums/biome-pool-tier";
import { Challenges } from "#enums/challenges";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import type {
  CustomDailyRunConfig,
  DailyEventChallenge,
  DailyEventMysteryEncounter,
  DailyForcedWave,
  DailyTrainerManipulation,
} from "#types/daily-run";
import { getEnumKeys } from "#utils/enums";
import { toTitleCase, toUpperSnakeCase } from "#utils/strings";
import { confirm, input, number, search, select } from "@inquirer/prompts";
import { Ajv } from "ajv";
import chalk from "chalk";
import customDailyRunSchema from "../../../src/data/daily-seed/schema.json";
import { promptSpeciesId } from "./pokemon.js";

const ajv = new Ajv({
  allErrors: true,
});

/**
 * The validator for the {@linkcode CustomDailyRunConfig}.
 */
const validate = ajv.compile(customDailyRunSchema);

/**
 * Prompt the user to enter a starting money value.
 * @returns A Promise that resolves with the starting money value.
 */
export async function promptMoney(): Promise<number> {
  return await number({
    message: "Please enter the starting money value to set.",
    default: 1000,
    min: 0,
    required: true,
  });
}

/**
 * Prompt the user to enter a starting luck value.
 * Must be a number between 0 and 14.
 * @returns A Promise that resolves with the chosen luck value.
 */
export async function promptLuck(): Promise<number> {
  return await number({
    message: "Please enter the initial luck value to set.",
    min: 0,
    max: 14,
    required: true,
  });
}

/**
 * Prompt the user to enter a starting biome.
 * @returns A Promise that resolves with the chosen biome.
 */
export async function promptBiome(): Promise<BiomeId> {
  const biomeName = await search({
    message: "Please enter the starting biome to set.",
    source: term => {
      const biomes = Object.keys(BiomeId).map(toTitleCase);
      if (!term) {
        return biomes;
      }
      return biomes.filter(id => id.toLowerCase().includes(term.toLowerCase()));
    },
  });
  const biomeId = BiomeId[toUpperSnakeCase(biomeName) as keyof typeof BiomeId];
  return biomeId as BiomeId;
}

/**
 * Prompt the user to enter a custom config.
 * The input is a JSON stringified version of the {@linkcode CustomDailyRunConfig} object.
 * @returns A Promise that resolves with the parsed {@linkcode CustomDailyRunConfig}.
 */
export async function promptEdit(): Promise<Partial<CustomDailyRunConfig>> {
  const config = await input({
    message: chalk.blue("Enter a custom config to use."),
    validate: value => {
      try {
        const parsed = JSON.parse(value);

        if (!validate(parsed)) {
          return (
            chalk.red.bold("Invalid config file specified!\n")
            + validate.errors?.map(e => `${e.instancePath} ${e.message}`).join("\n")
          );
        }

        return true;
      } catch {
        if (value.trim() === "") {
          return true;
        }
        return chalk.red.bold("Invalid JSON!");
      }
    },
  });

  if (config.trim() === "") {
    return {};
  }
  return JSON.parse(config);
}

/**
 * Prompt the user to enter a seed.
 * This can be anything and is used as the actual daily run seed.
 * @returns A Promise that resolves with the chosen seed.
 */
export async function promptSeed(): Promise<string> {
  return await input({
    message: "Please enter seed.",
    validate: value => {
      if (value.trim() === "") {
        return chalk.red.bold("Seed cannot be empty!");
      }
      return true;
    },
  });
}

/**
 * Prompt the user to enter a list of forced waves.
 * @returns A Promise that resolves with the list of forced waves.
 */
export async function promptForcedWaves(): Promise<DailyForcedWave[] | undefined> {
  const forcedWaves: DailyForcedWave[] = [];

  // TODO: Consider reworking this into a do while loop?
  async function addForcedWave(): Promise<void> {
    const waveIndex = await number({
      message: "Please enter the wave to force.\nPressing ENTER will end the prompt early.",
      min: 1,
      max: 49,
      validate: value => {
        if (forcedWaves.some(wave => wave.waveIndex === value)) {
          return chalk.red.bold("Wave already forced!");
        }
        return true;
      },
    });
    if (!waveIndex) {
      return;
    }

    const hiddenAbility = await confirm({
      message: "Should the forced wave have the hidden ability?",
      default: false,
    });

    // TODO: Remove type parameter if or when `select`'s type parameter becomes `const Value`
    // https://github.com/SBoudrias/Inquirer.js/issues/2101
    const waveType = await select({
      message: "Please select the type of wave to force.",
      choices: ["Species", "Tier"] as const,
    });
    switch (waveType) {
      case "Species": {
        const speciesId = await promptSpeciesId();
        forcedWaves.push({ waveIndex, speciesId, hiddenAbility: hiddenAbility ? true : undefined });
        break;
      }
      case "Tier": {
        const poolTier = await select({
          message: "Please select the pool tier to force.",
          choices: [...getEnumKeys(BIOME_POOL_TIERS).map(toTitleCase)],
          pageSize: 10,
        });
        forcedWaves.push({
          waveIndex,
          tier: BIOME_POOL_TIERS[toUpperSnakeCase(poolTier) as keyof typeof BIOME_POOL_TIERS],
          hiddenAbility: hiddenAbility ? true : undefined,
        });
        break;
      }
      default:
        waveType satisfies never;
    }
    await addForcedWave();
  }

  await addForcedWave();
  if (forcedWaves.length === 0) {
    return;
  }
  return forcedWaves;
}

/**
 * Prompt the user to enter a list of trainer manipulations.
 * @returns A Promise that resolves with the list of trainer manipulations.
 */
export async function promptTrainerManipulation(): Promise<DailyTrainerManipulation[] | undefined> {
  const trainerManipulations: DailyTrainerManipulation[] = [];

  async function addTrainerManipulation() {
    const waveIndex = await number({
      message: "Please enter the wave to manipulate.\nPressing ENTER will end the prompt early.",
      min: 1,
      max: 49,
      validate: value => {
        if (trainerManipulations.some(wave => wave.waveIndex === value)) {
          return chalk.red.bold("Wave already manipulated!");
        }
        return true;
      },
    });
    if (!waveIndex) {
      return;
    }

    const isTrainer = await confirm({
      message: "Should the wave be a trainer?",
      default: false,
    });

    trainerManipulations.push({ waveIndex, isTrainer });

    await addTrainerManipulation();
  }

  await addTrainerManipulation();
  if (trainerManipulations.length === 0) {
    return;
  }
  return trainerManipulations;
}

/**
 * Prompt the user to enter a list of challenges.
 * @returns A Promise that resolves with the list of challenges.
 */
export async function promptChallenges(): Promise<DailyEventChallenge[] | undefined> {
  const challenges: DailyEventChallenge[] = [];
  const challengeNames = getEnumKeys(Challenges).map(toTitleCase);
  challengeNames.unshift("Finish");

  async function addChallenge() {
    const challenge = await search({
      message: "Please enter the challenge to add.\nPressing ENTER will end the prompt early.",
      source: term => {
        if (!term) {
          return challengeNames;
        }
        return challengeNames.filter(id => id.toLowerCase().includes(term.toLowerCase()));
      },
    });
    if (challenge === "Finish") {
      return;
    }

    const value = await number({
      message: `Please enter the value for ${challenge}. This is NOT validted atm.`,
      min: 0,
      required: true,
    });

    const challengeId = Challenges[toUpperSnakeCase(challenge) as keyof typeof Challenges];
    challenges.push({ id: challengeId, value });
    challengeNames.splice(challengeNames.indexOf(challenge), 1);
    await addChallenge();
  }
  await addChallenge();

  if (challenges.length === 0) {
    return;
  }
  return challenges;
}

/**
 * Prompt the user to enter a list of mystery encounters.
 * @returns A Promise that resolves with the list of mystery encounters.
 */
export async function promptMysteryEncounters(): Promise<DailyEventMysteryEncounter[] | undefined> {
  const mysteryEncounters: DailyEventMysteryEncounter[] = [];

  async function addMysteryEncounter() {
    const waveIndex = await number({
      message: "Please enter the wave to force a mystery encounter.\nPressing ENTER will end the prompt early.",
      min: 1,
      max: 49,
      validate: value => {
        if (mysteryEncounters.some(wave => wave.waveIndex === value)) {
          return chalk.red.bold("Wave already has a mystery encounter!");
        }
        return true;
      },
    });
    if (!waveIndex) {
      return;
    }

    const type = await search({
      message: "Please select the mystery encounter to force.",
      source: term => {
        if (!term) {
          return getEnumKeys(MysteryEncounterType).map(toTitleCase);
        }
        return getEnumKeys(MysteryEncounterType)
          .map(toTitleCase)
          .filter(id => id.toLowerCase().includes(term.toLowerCase()));
      },
    });

    const typeId = MysteryEncounterType[toUpperSnakeCase(type) as keyof typeof MysteryEncounterType];
    mysteryEncounters.push({ waveIndex, type: typeId });
    await addMysteryEncounter();
  }

  await addMysteryEncounter();
  if (mysteryEncounters.length === 0) {
    return;
  }
  return mysteryEncounters;
}
