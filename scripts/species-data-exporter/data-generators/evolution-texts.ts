/*
 * SPDX-FileCopyrightText: 2026 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { speciesDataRegistry } from "#app/global-species-data-registry";
import { supportedLngs } from "#app/i18n-supported-lngs";
import { EvoCondKey, EvolutionItem, type SpeciesFormEvolution } from "#balance/pokemon-evolutions";
import { getGenderSymbol } from "#data/gender";
import { MoveId } from "#enums/move-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { TimeOfDay } from "#enums/time-of-day";
import { toCamelCase } from "#utils/strings";
import i18next, { type TFunction } from "i18next";
import { writeData } from "../helpers";
import type { EvolutionTextEntry } from "../types";

export async function generateEvolutionTextsData() {
  const entries: EvolutionTextEntry[] = [];
  const entryEvolutions: SpeciesFormEvolution[] = [];
  for (const speciesData of Object.values(speciesDataRegistry.data)) {
    const evolutions = speciesData.evolutions;
    if (evolutions) {
      for (const evo of evolutions) {
        entries.push({
          preDexNum: speciesData.species.speciesId,
          preId: SpeciesId[speciesData.species.speciesId],
          preFormKey: evo.preFormKey,
          evoDexNum: evo.speciesId,
          evoId: SpeciesId[evo.speciesId],
          evoFormKey: evo.evoFormKey,
        } as EvolutionTextEntry);
        entryEvolutions.push(evo);
      }
    }
  }

  for (const lng of supportedLngs) {
    const translate = i18next.getFixedT(lng);
    for (const [index, evo] of entryEvolutions.entries()) {
      const conditions = getEvoConditionDescription(evo, translate);
      entries[index][lng] = conditions.length > 0 ? conditions.join("|") : null;
    }
  }

  writeData("evolution-texts", entries);
}

export function getEvoConditionDescription(evo: SpeciesFormEvolution, t: TFunction): string[] {
  const ret: string[] = [];

  const descriptions = evo.condition?.data
    .map(cond => {
      switch (cond.key) {
        case EvoCondKey.FRIENDSHIP:
          return t("pokemonEvolutions:friendship");
        case EvoCondKey.TIME:
          return t(`pokemonEvolutions:timeOfDay.${toCamelCase(TimeOfDay[cond.time.at(-1)!])}`); // For Day and Night evos, the key we want goes last
        case EvoCondKey.MOVE_TYPE:
          return t("pokemonEvolutions:moveType", {
            type: t(`pokemonInfo:type.${toCamelCase(PokemonType[cond.pkmnType])}`),
          });
        case EvoCondKey.PARTY_TYPE:
          return t("pokemonEvolutions:partyType", {
            type: t(`pokemonInfo:type.${toCamelCase(PokemonType[cond.pkmnType])}`),
          });
        case EvoCondKey.GENDER:
          return t("pokemonEvolutions:gender", { gender: getGenderSymbol(cond.gender) });
        case EvoCondKey.MOVE:
        case EvoCondKey.TYROGUE:
          return t("pokemonEvolutions:move", {
            move: t(`move:${toCamelCase(MoveId[cond.move])}.name`),
          });
        case EvoCondKey.BIOME:
          return t("pokemonEvolutions:biome");
        case EvoCondKey.NATURE:
          return t("pokemonEvolutions:nature");
        case EvoCondKey.WEATHER:
          return t("pokemonEvolutions:weather");
        case EvoCondKey.SHEDINJA:
          return t("pokemonEvolutions:shedinja");
        case EvoCondKey.EVO_TREASURE_TRACKER:
          return t("pokemonEvolutions:treasure");
        case EvoCondKey.SPECIES_CAUGHT:
          return t("pokemonEvolutions:caught", {
            species: speciesDataRegistry.getSpecies(cond.speciesCaught)?.name,
          });
        case EvoCondKey.HELD_ITEM:
          return t(`pokemonEvolutions:heldItem.${toCamelCase(cond.itemKey)}`);
        case EvoCondKey.RANDOM_FORM:
          return null;
        default:
          cond satisfies never;
          return null;
      }
    })
    .filter(s => s != null); // Filter out stringless conditions

  ret.push(...(descriptions ?? []));

  if (evo.level > 1) {
    ret.push(t("pokemonEvolutions:atLevel", { lv: evo.level }));
  }
  if (evo.item) {
    const itemDescription = t(`modifierType:EvolutionItem.${EvolutionItem[evo.item].toUpperCase()}`);
    const rarity = evo.item > 50 ? t("pokemonEvolutions:ultra") : t("pokemonEvolutions:great");
    ret.push(t("pokemonEvolutions:using", { item: itemDescription, tier: rarity }));
  }
  if (evo.condition && ret.length === 0) {
    ret.push(t("pokemonEvolutions:levelUp"));
  }

  return ret;
}
