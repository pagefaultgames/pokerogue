/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { Nature } from "#enums/nature";
import { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { StarterMoveset } from "#types/save-data";
import { getEnumKeys } from "#utils/enums";
import { toTitleCase, toUpperSnakeCase } from "#utils/strings";
import { number, search } from "@inquirer/prompts";

// TODO: Change all these prompts to pass `Choice` objects to inquirer to avoid re-mapping cases back and forth
// (which would also remove the annoying type assertions)

/**
 * Prompt the user to enter a speciesId.
 * @returns A Promise that resolves with the chosen `SpeciesId`.
 */
export async function promptSpeciesId(): Promise<SpeciesId> {
  const speciesName = await search({
    message: "Please enter the SpeciesId to set.",
    source: term => {
      const species = getEnumKeys(SpeciesId).map(toTitleCase);
      if (!term) {
        return species;
      }
      return species.filter(id => id.toLowerCase().includes(term.toLowerCase()));
    },
  });
  const speciesId = SpeciesId[toUpperSnakeCase(speciesName) as keyof typeof SpeciesId];
  return speciesId;
}

/**
 * Prompt the user to enter a form index.
 * @returns A Promise that resolves with the chosen form index.
 */
// TODO: Validate the form indices based on the selected species if/when project references allow us to import main repo code
export async function promptFormIndex(): Promise<number> {
  return await number({
    message: "Please enter the form index to set.",
    min: 0,
    required: true,
  });
}

/**
 * Prompt the user to enter a variant.
 * @returns A Promise that resolves with the chosen variant.
 * @remarks
 * This does **NOT** validate that the variant exists for the given species.
 */
export async function promptVariant(): Promise<Variant> {
  // NB: Type assertion here is OK as the prompt will always range from 0-2
  return (await number({
    message: "Please enter the variant to set.",
    min: 0,
    max: 2,
    step: 1,
    required: true,
  })) as Variant;
}

/**
 * Prompt the user to enter a nature.
 * @returns A Promise that resolves with the chosen nature.
 */
export async function promptNature(): Promise<Nature> {
  const natureName = await search({
    message: "Please enter the nature to set.",
    source: term => {
      const natures = getEnumKeys(Nature).map(toTitleCase);
      if (!term) {
        return natures;
      }
      return natures.filter(id => id.toLowerCase().includes(term.toLowerCase()));
    },
  });
  const natureId = Nature[toUpperSnakeCase(natureName) as keyof typeof Nature];
  return natureId;
}

/**
 * Prompt the user to enter a moveset of up to 4 moves.
 * @returns A Promise that resolves with the chosen moveset.
 */
export async function promptMoveset(): Promise<StarterMoveset> {
  const moveset: MoveId[] = [];

  async function addMove() {
    const moveName = await search({
      message:
        "Please enter the move to add to the moveset.\nPressing ENTER with 'None' selected will end the prompt early.",
      source: term => {
        const moves = getEnumKeys(MoveId).map(toTitleCase);
        if (!term) {
          return moves;
        }
        return moves.filter(id => id.toLowerCase().includes(term.toLowerCase()));
      },
      validate: value => {
        const moveId = MoveId[toUpperSnakeCase(value) as keyof typeof MoveId];
        if (moveset.includes(moveId)) {
          return "Move already in moveset!";
        }
        return true;
      },
    });
    const moveId = MoveId[toUpperSnakeCase(moveName) as keyof typeof MoveId];

    if (!moveId) {
      return;
    }
    moveset.push(moveId);
    if (moveset.length < 4) {
      await addMove();
    }
  }

  await addMove();
  return moveset as StarterMoveset;
}

/**
 * Prompt the user to enter an ability.
 * @param passive - (Default `false`) Whether to prompt for a passive ability.
 * @returns A Promise that resolves with the chosen ability.
 */
export async function promptAbility(passive = false): Promise<AbilityId> {
  const abilityName = await search({
    message: `Please enter the ${passive ? "passive" : "normal"} ability of the final boss.`,
    source: term => {
      const abilities = getEnumKeys(AbilityId).map(toTitleCase);
      if (!term) {
        return abilities;
      }
      return abilities.filter(id => id.toLowerCase().includes(term.toLowerCase()));
    },
  });
  const abilityId = AbilityId[toUpperSnakeCase(abilityName) as keyof typeof AbilityId];
  return abilityId;
}

/**
 * Prompt the user to enter the number of segments for the boss fight.
 * @returns A Promise that resolves with the chosen number of segments.
 */
export async function promptSegments(): Promise<number> {
  return await number({
    message: "Please enter the number of segments for the boss fight.",
    min: 1,
    default: 5,
    required: true,
  });
}
