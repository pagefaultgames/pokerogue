import { globalScene } from "#app/global-scene";
import { MoveEndPhase } from "#app/phases/move-end-phase";
import { EggHatchPhase } from "#app/phases/egg-hatch-phase";
import { Moves } from "#enums/moves";
import { Abilities } from "#enums/abilities";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phase from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .enemySpecies(Species.MAGIKARP)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([Moves.SUNNY_DAY, Moves.GRASSY_TERRAIN])
      .startingHeldItems([{ name: "MYSTICAL_ROCK", count: 2 }])
      .battleType("single");
  }, 20000);

  it("should increase weather duration by +2 turns per stack", async () => {
    await game.startBattle([Species.GASTLY]);

    game.move.select(Moves.SUNNY_DAY);

    await game.phaseInterceptor.to(MoveEndPhase);

    const weather = globalScene.arena.weather;

    expect(weather).toBeDefined();
    expect(weather!.turnsLeft).to.equal(9);
  }, 20000);

  it("should increase terrain duration by +2 turns per stack", async () => {
    await game.startBattle([Species.GASTLY]);

    game.move.select(Moves.GRASSY_TERRAIN);

    await game.phaseInterceptor.to(MoveEndPhase);

    const terrain = globalScene.arena.terrain;

    expect(terrain).toBeDefined();
    expect(terrain!.turnsLeft).to.equal(9);
  }, 20000);
});
