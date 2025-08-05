import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Arena - Psychic Terrain", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .criticalHits(false)
      .enemyLevel(1)
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyAbility(AbilityId.STURDY)
      .enemyMoveset(MoveId.SPLASH)
      .moveset([MoveId.PSYCHIC_TERRAIN, MoveId.RAIN_DANCE, MoveId.DARK_VOID])
      .ability(AbilityId.NO_GUARD);
  });

  it("Dark Void with Prankster is not blocked", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.DARK_VOID);
    await game.toEndOfTurn();

    expect(game.field.getEnemyPokemon().status?.effect).toBe(StatusEffect.SLEEP);
  });

  it("Rain Dance with Prankster is not blocked", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    game.move.select(MoveId.PSYCHIC_TERRAIN);
    await game.toNextTurn();

    game.move.select(MoveId.RAIN_DANCE);
    await game.toEndOfTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.RAIN);
  });
});
