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
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .enemyMoveset(MoveId.SPLASH)
      .startingLevel(100);
  });

  it("should remove terrain on summon", async () => {
    game.override.startingTerrain(TerrainType.ELECTRIC);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveAbilityApplied(AbilityId.TERAFORM_ZERO);
    expect(game).toHaveTerrain(TerrainType.NONE);
  });

  it("should remove weather on summon, including immutable ones", async () => {
    game.override.enemyAbility(AbilityId.PRIMORDIAL_SEA);
    const weatherSpy = vi.spyOn(game.scene.arena, "trySetWeather");
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const feebas = game.field.getPlayerPokemon();
    expect(feebas).toHaveAbilityApplied(AbilityId.TERAFORM_ZERO);
    expect(weatherSpy).toHaveBeenCalledWith(WeatherType.NONE);
    expect(game).toHaveWeather(WeatherType.NONE);
  });
});
