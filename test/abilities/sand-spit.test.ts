import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Abilities - Sand Spit", () => {
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
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .starterSpecies(SpeciesId.SILICOBRA)
      .ability(AbilityId.SAND_SPIT)
      .moveset([MoveId.SPLASH, MoveId.COIL]);
  });

  it("should trigger when hit with damaging move", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]);
    await game.classicMode.startBattle();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SANDSTORM);
  });

  it("should trigger even when fainting", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]).enemyLevel(100).startingLevel(1);
    await game.classicMode.startBattle([SpeciesId.SILICOBRA, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.SPLASH);
    game.doSelectPartyPokemon(1);
    await game.toNextTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SANDSTORM);
  });

  it("should not trigger when targetted with status moves", async () => {
    game.override.enemyMoveset([MoveId.GROWL]);
    await game.classicMode.startBattle();

    game.move.select(MoveId.COIL);
    await game.toNextTurn();

    expect(game.scene.arena.weather?.weatherType).not.toBe(WeatherType.SANDSTORM);
  });
});
