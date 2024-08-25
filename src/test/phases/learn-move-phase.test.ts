import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
//import * as Utils from "#app/utils";
import { Moves } from "#enums/moves";
// import BattleScene from "#app/battle-scene";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import Overrides from "#app/overrides";
//import { allMoves } from "#app/data/move";

describe("Learn Move Phase", () => {
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
    Overrides.XP_MULTIPLIER_OVERRIDE = 50;
    game.override.startingLevel(5);
  });

  it("If Pokemon has less than 4 moves, its newest move will be added to the lowest empty index", async () => {
    game.override.moveset([Moves.SPLASH]);
    await game.startBattle([Species.BULBASAUR]);
    const pokemon = game.scene.getPlayerPokemon()!;
    const newMovePos = pokemon?.getMoveset().length;
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(LearnMovePhase);
    const levelMove = pokemon.getLevelMoves(5)[0];
    const levelReq = levelMove[0];
    const levelMoveId = levelMove[1];
    expect(pokemon.level).toBeGreaterThanOrEqual(levelReq);
    expect(pokemon.getMoveset()[newMovePos]).toBe(levelMoveId);
  });
});
