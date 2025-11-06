/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const MAX_SPECIES_ID = 1025;

const SPECIAL_SPECIES_IDS = [
  2019, 2020, 2026, 2027, 2028, 2037, 2038, 2050, 2051, 2052, 2053, 2074, 2075, 2076, 2088, 2089, 2103, 2105, 2670,
  4052, 4077, 4078, 4079, 4080, 4083, 4110, 4122, 4144, 4145, 4146, 4199, 4222, 4263, 4264, 4554, 4555, 4562, 4618,
  6058, 6059, 6100, 6101, 6157, 6211, 6215, 6503, 6549, 6570, 6571, 6628, 6705, 6706, 6713, 6724, 8128, 8194, 8901,
];

export const SPECIES_IDS = [...Array.from({ length: MAX_SPECIES_ID }, (_, i) => i + 1), ...SPECIAL_SPECIES_IDS];

export const BIOMES = {
  TOWN: 0,
  PLAINS: 1,
  GRASS: 2,
  TALL_GRASS: 3,
  METROPOLIS: 4,
  FOREST: 5,
  SEA: 6,
  SWAMP: 7,
  BEACH: 8,
  LAKE: 9,
  SEABED: 10,
  MOUNTAIN: 11,
  BADLANDS: 12,
  CAVE: 13,
  DESERT: 14,
  ICE_CAVE: 15,
  MEADOW: 16,
  POWER_PLANT: 17,
  VOLCANO: 18,
  GRAVEYARD: 19,
  DOJO: 20,
  FACTORY: 21,
  RUINS: 22,
  WASTELAND: 23,
  ABYSS: 24,
  SPACE: 25,
  CONSTRUCTION_SITE: 26,
  JUNGLE: 27,
  FAIRY_CAVE: 28,
  TEMPLE: 29,
  SLUM: 30,
  SNOWY_FOREST: 31,
  ISLAND: 40,
  LABORATORY: 41,
  END: 50,
};

export const NATURES = {
  HARDY: 0,
  LONELY: 1,
  BRAVE: 2,
  ADAMANT: 3,
  NAUGHTY: 4,
  BOLD: 5,
  DOCILE: 6,
  RELAXED: 7,
  IMPISH: 8,
  LAX: 9,
  TIMID: 10,
  HASTY: 11,
  SERIOUS: 12,
  JOLLY: 13,
  NAIVE: 14,
  MODEST: 15,
  MILD: 16,
  QUIET: 17,
  BASHFUL: 18,
  RASH: 19,
  CALM: 20,
  GENTLE: 21,
  SASSY: 22,
  CAREFUL: 23,
  QUIRKY: 24,
};

export const BOSS_OPTIONS = ["formIndex", "variant", "moveset", "nature", "ability", "passive", "finish"];
export const STARTER_OPTIONS = ["formIndex", "variant", "moveset", "nature", "abilityIndex", "finish"];
