import { globalScene } from "#app/global-scene";
import { TerrainType } from "#data/terrain";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { WeatherType } from "#enums/weather-type";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Mystical Rock", () => {
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
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([MoveId.SUNNY_DAY, MoveId.GRASSY_TERRAIN])
      .startingHeldItems([{ name: "MYSTICAL_ROCK", count: 2 }])
      .battleStyle("single");
  });

  it("should increase weather duration by +2 turns per stack", async () => {
    await game.classicMode.startBattle(SpeciesId.GASTLY);

    game.move.use(MoveId.SUNNY_DAY);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(game).toHaveWeather(WeatherType.SUNNY);
    expect(game.scene.arena.weather?.turnsLeft).toBe(9);
  });

  it("should increase terrain duration by +2 turns per stack", async () => {
    await game.classicMode.startBattle(SpeciesId.GASTLY);

    game.move.use(MoveId.GRASSY_TERRAIN);
    await game.phaseInterceptor.to("MoveEndPhase");

    expect(game).toHaveTerrain(TerrainType.GRASSY);
    expect(game.scene.arena.terrain?.turnsLeft).toBe(9);
  });
});
