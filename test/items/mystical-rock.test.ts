import { globalScene } from "#app/global-scene";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Mystical Rock", () => {
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
      .enemySpecies(SpeciesId.SHUCKLE)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([MoveId.SUNNY_DAY, MoveId.GRASSY_TERRAIN])
      .startingHeldItems([{ name: "MYSTICAL_ROCK", count: 2 }])
      .battleStyle("single");
  });

  it("should increase weather duration by +2 turns per stack", async () => {
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    game.move.select(MoveId.SUNNY_DAY);

    await game.phaseInterceptor.to("MoveEndPhase");

    const weather = globalScene.arena.weather;

    expect(weather).toBeDefined();
    expect(weather!.turnsLeft).to.equal(9);
  });

  it("should increase terrain duration by +2 turns per stack", async () => {
    await game.classicMode.startBattle([SpeciesId.GASTLY]);

    game.move.select(MoveId.GRASSY_TERRAIN);

    await game.phaseInterceptor.to("MoveEndPhase");

    const terrain = globalScene.arena.terrain;

    expect(terrain).toBeDefined();
    expect(terrain!.turnsLeft).to.equal(9);
  });
});
