/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * A mapping of biome pool tier names to their corresponding IDs.
 * @enum {number}
 */
export const BIOME_POOL_TIERS = {
  COMMON: 0,
  UNCOMMON: 1,
  RARE: 2,
  SUPER_RARE: 3,
  ULTRA_RARE: 4,
  BOSS: 5,
  BOSS_RARE: 6,
  BOSS_SUPER_RARE: 7,
  BOSS_ULTRA_RARE: 8,
};

// #endregion Constants

// #region Options

/**
 * All accepted options for editing the daily seed config directly.
 */
export const EDIT_OPTIONS = /** @type {const} */ ([
  "starters",
  "boss",
  "biome",
  "luck",
  "forced waves",
  "starting money",
  "seed",
  "edit",
  "finish",
  "exit",
]);

/** All accepted options for configuring a boss Pokemon. */
export const BOSS_OPTIONS = /** @type {const} */ ([
  "formIndex",
  "variant",
  "moveset",
  "nature",
  "ability",
  "passive",
  "finish",
]);

/** All accepted options for configuring a starter Pokemon. */
export const STARTER_OPTIONS = /** @type {const} */ ([
  "formIndex",
  "variant",
  "moveset",
  "nature",
  "abilityIndex",
  "finish",
]);

// #endregion Options
