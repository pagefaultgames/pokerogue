import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Baddy Bad", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  const TIMEOUT = 20 * 1000;

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
      .battleType("single")
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .ability(Abilities.BALL_FETCH);
  });

  it("should not activate Reflect if the move fails due to Protect", async () => {
    game.override.enemyMoveset(Moves.PROTECT);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.BADDY_BAD);
    await game.phaseInterceptor.to("BerryPhase");

    expect(game.scene.arena.tags.length).toBe(0);
  }, TIMEOUT);
});
