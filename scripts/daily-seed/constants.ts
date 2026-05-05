/*
 * SPDX-FileCopyrightText: 2025 Pagefault Games
 * SPDX-FileContributor: Fabske0
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * All accepted options for editing the daily seed config directly.
 */
export const EDIT_OPTIONS = [
  "starters",
  "boss",
  "biome",
  "luck",
  "forced waves",
  "trainer manipulation",
  "challenges",
  "mystery encounters",
  "starting money",
  "seed",
  "edit",
  "finish",
  "exit",
] as const;

/** All accepted options for configuring a boss Pokemon. */
export const BOSS_OPTIONS = [
  "formIndex",
  "variant",
  "moveset",
  "nature",
  "ability",
  "passive",
  "segments",
  "catchable",
  "finish",
] as const;

/** All accepted options for configuring a starter Pokemon. */
export const STARTER_OPTIONS = ["formIndex", "variant", "moveset", "nature", "ability", "passive", "finish"] as const;
