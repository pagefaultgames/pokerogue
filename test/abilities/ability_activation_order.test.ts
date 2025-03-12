import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
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

  it("should activate the ability of the faster Pokemon first", async () => {
    game.override.enemyLevel(100).ability(Abilities.DRIZZLE).enemyAbility(Abilities.DROUGHT);
    await game.classicMode.startBattle([Species.SLOWPOKE]);

    // Enemy's ability should activate first, so sun ends up replaced with rain
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.RAIN);
  });

  it("should consider base stat boosting items in determining order", async () => {
    game.override
      .startingLevel(25)
      .enemyLevel(50)
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.DROUGHT)
      .ability(Abilities.DRIZZLE)
      .startingHeldItems([{ name: "BASE_STAT_BOOSTER", type: Stat.SPD, count: 100 }]);

    await game.classicMode.startBattle([Species.MAGIKARP]);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });

  it("should consider stat boosting items in determining order", async () => {
    game.override
      .startingLevel(35)
      .enemyLevel(50)
      .enemySpecies(Species.DITTO)
      .enemyAbility(Abilities.DROUGHT)
      .ability(Abilities.DRIZZLE)
      .startingHeldItems([{ name: "SPECIES_STAT_BOOSTER", type: "QUICK_POWDER" }]);

    await game.classicMode.startBattle([Species.DITTO]);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });
});
