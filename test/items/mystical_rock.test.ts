import { globalScene } from "#app/global-scene";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Items - Mystical Rock", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phase.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);

    game.override
      .enemySpecies(Species.SHUCKLE)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([Moves.SUNNY_DAY, Moves.GRASSY_TERRAIN])
      .startingHeldItems([{ name: "MYSTICAL_ROCK", count: 2 }])
      .battleStyle("single");
  });

  it("should increase weather duration by +2 turns per stack", async () => {
    await game.classicMode.startBattle([Species.GASTLY]);

    game.move.select(Moves.SUNNY_DAY);

    await game.phaseInterceptor.to("MoveEndPhase");

    const weather = globalScene.arena.weather;

    expect(weather).toBeDefined();
    expect(weather!.turnsLeft).to.equal(9);
  });

  it("should increase terrain duration by +2 turns per stack", async () => {
    await game.classicMode.startBattle([Species.GASTLY]);

    game.move.select(Moves.GRASSY_TERRAIN);

    await game.phaseInterceptor.to("MoveEndPhase");

    const terrain = globalScene.arena.terrain;

    expect(terrain).toBeDefined();
    expect(terrain!.turnsLeft).to.equal(9);
  });
});
