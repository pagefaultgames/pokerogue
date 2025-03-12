import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { WeatherType } from "#enums/weather-type";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Ability Activation Order", () => {
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
      .moveset([Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it.todo("should activate the ability of the faster Pokemon first", async () => {
    game.override.enemyLevel(100).ability(Abilities.DRIZZLE).enemyAbility(Abilities.DROUGHT);
    await game.classicMode.startBattle([Species.SLOWPOKE]);

    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });
});
