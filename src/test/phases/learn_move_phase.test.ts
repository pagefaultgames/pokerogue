import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
import * as Utils from "#app/utils";
import { Moves } from "#enums/moves";
import { allMoves } from "#app/data/move";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import { LearnMovePhase } from "#app/phases/learn-move-phase"

describe("Learn Move Phase", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;
  let scene: BattleScene;

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
    scene = game.scene;
  });

  describe("If Pokemon has less than 4 moves, its newest move will be added to the lowest empty index", () => {
    it("new move should be found at index 1", async () => {
      game.override.moveset(SPLASH_ONLY);
	  await game.startBattle([Species.BULBASAUR]);
	  const pokemon = game.scene.getPlayerPokemon()!;
	  const prevLength = pokemon?.getMoveset().length;
      pokemon?.addExp(1000);
      await game.phaseInterceptor.to(LearnMovePhase, false);
      const phase = game.scene.getCurrentPhase() as MoveLearnPhase;
      const newMove = phase.moveId; 
      const messageMode = phase.messageMode;

      console.log(allMoves[newMove]);
    });
  });
});