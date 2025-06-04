import { WeatherType } from "#app/enums/weather-type";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
    game.override.battleStyle("single");
    game.override.disableCrits();

    game.override.enemySpecies(Species.MAGIKARP);
    game.override.enemyAbility(AbilityId.BALL_FETCH);

    game.override.starterSpecies(Species.SILICOBRA);
    game.override.ability(AbilityId.SAND_SPIT);
    game.override.moveset([MoveId.SPLASH, MoveId.COIL]);
  });

  it("should trigger when hit with damaging move", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]);
    await game.classicMode.startBattle();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SANDSTORM);
  }, 20000);

  it("should trigger even when fainting", async () => {
    game.override.enemyMoveset([MoveId.TACKLE]).enemyLevel(100).startingLevel(1);
    await game.classicMode.startBattle([Species.SILICOBRA, Species.MAGIKARP]);

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
  }, 20000);
});
