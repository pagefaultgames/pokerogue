/*
 * SPDX-FileCopyrightText: 2024-2025 Pagefault Games
 *
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability - Teraform Zero", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .ability(AbilityId.TERAFORM_ZERO)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should remove terrain on summon", async () => {
    game.override.startingTerrain(TerrainType.ELECTRIC);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveAbilityApplied(AbilityId.TERAFORM_ZERO);
    expect(game).toHaveTerrain(TerrainType.NONE);
  });

  it("should remove weather on summon, including immutable ones", async () => {
    // Ensure we are slower so primordial sea procs first
    game.override.enemyAbility(AbilityId.PRIMORDIAL_SEA).enemyLevel(100);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveAbilityApplied(AbilityId.TERAFORM_ZERO);
    expect(game).toHaveWeather(WeatherType.NONE);
  });
});
