import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/test-utils/game-manager";
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
      .moveset([MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should activate the ability of the faster Pokemon first", async () => {
    game.override.enemyLevel(100).ability(AbilityId.DRIZZLE).enemyAbility(AbilityId.DROUGHT);
    await game.classicMode.startBattle([SpeciesId.SLOWPOKE]);

    // Enemy's ability should activate first, so sun ends up replaced with rain
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.RAIN);
  });

  it("should consider base stat boosting items in determining order", async () => {
    game.override
      .startingLevel(25)
      .enemyLevel(50)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.DROUGHT)
      .ability(AbilityId.DRIZZLE)
      .startingHeldItems([{ name: "BASE_STAT_BOOSTER", type: Stat.SPD, count: 100 }]);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });

  it("should consider stat boosting items in determining order", async () => {
    game.override
      .startingLevel(35)
      .enemyLevel(50)
      .enemySpecies(SpeciesId.DITTO)
      .enemyAbility(AbilityId.DROUGHT)
      .ability(AbilityId.DRIZZLE)
      .startingHeldItems([{ name: "SPECIES_STAT_BOOSTER", type: "QUICK_POWDER" }]);

    await game.classicMode.startBattle([SpeciesId.DITTO]);
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });

  it("should activate priority abilities first", async () => {
    game.override
      .startingLevel(1)
      .enemyLevel(100)
      .enemySpecies(SpeciesId.ACCELGOR)
      .enemyAbility(AbilityId.DROUGHT)
      .ability(AbilityId.NEUTRALIZING_GAS);

    await game.classicMode.startBattle([SpeciesId.SLOWPOKE]);
    expect(game.scene.arena.weather).toBeUndefined();
  });

  it("should update dynamically based on speed order", async () => {
    game.override
      .startingLevel(35)
      .enemyLevel(50)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.SLOW_START)
      .enemyPassiveAbility(AbilityId.DROUGHT)
      .ability(AbilityId.DRIZZLE);

    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);
    // Slow start activates and makes enemy slower, so drought activates after drizzle
    expect(game.scene.arena.weather?.weatherType).toBe(WeatherType.SUNNY);
  });
});
