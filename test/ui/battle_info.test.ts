import { ExpGainsSpeed } from "#app/enums/exp-gains-speed";
import { SpeciesId } from "#enums/species-id";
import { ExpPhase } from "#app/phases/exp-phase";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// biome-ignore lint/correctness/noEmptyPattern: TODO: Examine why this is here
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
      .moveset([MoveId.GUILLOTINE, MoveId.SPLASH])
      .battleStyle("single")
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.CATERPIE);
  });

  it.each([ExpGainsSpeed.FAST, ExpGainsSpeed.FASTER, ExpGainsSpeed.SKIP])(
    "should increase exp gains animation by 2^%i",
    async expGainsSpeed => {
      game.settings.expGainsSpeed(expGainsSpeed);
      vi.spyOn(Math, "pow");

      await game.classicMode.startBattle([SpeciesId.CHARIZARD]);

      game.move.select(MoveId.SPLASH);
      await game.doKillOpponents();
      await game.phaseInterceptor.to(ExpPhase, true);

      expect(Math.pow).not.toHaveBeenCalledWith(2, expGainsSpeed);
    },
  );
});
