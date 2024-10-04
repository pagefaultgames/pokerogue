import { ExpGainsSpeed } from "#app/enums/exp-gains-speed";
import { Species } from "#app/enums/species";
import { ExpPhase } from "#app/phases/exp-phase";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../data/exp", ({}) => {
  return {
    getLevelRelExp: vi.fn(() => 1), //consistent levelRelExp
  };
});

describe("UI - Battle Info", () => {
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
      .moveset([ Moves.GUILLOTINE, Moves.SPLASH ])
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.CATERPIE);
  });

  it.each([ ExpGainsSpeed.FAST, ExpGainsSpeed.FASTER, ExpGainsSpeed.SKIP ])(
    "should increase exp gains animation by 2^%i",
    async (expGainsSpeed) => {
      game.settings.expGainsSpeed(expGainsSpeed);
      vi.spyOn(Math, "pow");

      await game.classicMode.startBattle([ Species.CHARIZARD ]);

      game.move.select(Moves.SPLASH);
      await game.doKillOpponents();
      await game.phaseInterceptor.to(ExpPhase, true);

      expect(Math.pow).not.toHaveBeenCalledWith(2, expGainsSpeed);
    }
  );
});
