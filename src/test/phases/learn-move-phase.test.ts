import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import Phaser from "phaser";
import GameManager from "#test/utils/gameManager";
import { Species } from "#enums/species";
import { Moves } from "#enums/moves";
import { LearnMovePhase } from "#app/phases/learn-move-phase";
import { Mode } from "#app/ui/ui";
import { Button } from "#app/enums/buttons";

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
    game.override.xpMultiplier(50);
  });

  it("If Pokemon has less than 4 moves, its newest move will be added to the lowest empty index", async () => {
    game.override.moveset([ Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const pokemon = game.scene.getPlayerPokemon()!;
    const newMovePos = pokemon?.getMoveset().length;
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(LearnMovePhase);
    const levelMove = pokemon.getLevelMoves(5)[0];
    const levelReq = levelMove[0];
    const levelMoveId = levelMove[1];
    expect(pokemon.level).toBeGreaterThanOrEqual(levelReq);
    expect(pokemon?.moveset[newMovePos]?.moveId).toBe(levelMoveId);
  });

  it("If a pokemon has 4 move slots filled, the chosen move will be deleted and replaced", async () => {
    await game.classicMode.startBattle([ Species.GALAR_MR_MIME ]); // many level up moves
    const mrMime = game.scene.getPlayerPokemon()!;
    const prevMoveset = [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ];
    const moveSlotNum = 3;

    game.move.changeMoveset(mrMime, prevMoveset);
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();

    // queue up inputs to confirm dialog boxes
    game.onNextPrompt("LearnMovePhase", Mode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", Mode.SUMMARY, () => {
      for (let x = 0; x < moveSlotNum; x++) {
        game.scene.ui.processInput(Button.DOWN);
      }
      game.scene.ui.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.to(LearnMovePhase);

    const levelMove = mrMime.getLevelMoves(5)[0];
    const levelReq = levelMove[0];
    const levelMoveId = levelMove[1];
    expect(mrMime.level).toBeGreaterThanOrEqual(levelReq);
    // Check each of mr mime's moveslots to make sure the changed move (and ONLY the changed move) is different
    mrMime.getMoveset().forEach((move, index) => {
      const expectedMove: Moves = (index === moveSlotNum ? levelMoveId : prevMoveset[index]);
      expect(move?.moveId).toBe(expectedMove);
    });
  });

  it("selecting the newly deleted move will reject it and keep old moveset", async () => {
    await game.classicMode.startBattle([ Species.GALAR_MR_MIME ]); // many level up moves
    const mrMime = game.scene.getPlayerPokemon()!;
    const prevMoveset = [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ];

    game.move.changeMoveset(mrMime, [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ]);
    game.move.select(Moves.SPLASH);
    await game.doKillOpponents();

    // queue up inputs to confirm dialog boxes
    game.onNextPrompt("LearnMovePhase", Mode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", Mode.SUMMARY, () => {
      for (let x = 0; x < 4; x++) {
        game.scene.ui.processInput(Button.DOWN); // moves down 4 times to the 5th move slot
      }
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", Mode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.to(LearnMovePhase);

    const levelReq = mrMime.getLevelMoves(5)[0][0];
    expect(mrMime.level).toBeGreaterThanOrEqual(levelReq);
    expect(mrMime.getMoveset()).toEqual(prevMoveset);
  });

  it("macro should work", async () => {
    await game.classicMode.startBattle([ Species.GALAR_MR_MIME ]); // many level up moves
    const mrMime = game.scene.getPlayerPokemon()!;

    game.move.changeMoveset(mrMime, [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ]);
    await game.move.learnMove(Moves.SACRED_FIRE, 0, 3);
    expect(mrMime.getMoveset()).toEqual([ Moves.SPLASH, Moves.ABSORB, Moves.SACRED_FIRE, Moves.VINE_WHIP ]);

  });

  it("macro should work V2", async () => {
    await game.classicMode.startBattle([ Species.GALAR_MR_MIME ]); // many level up moves
    const mrMime = game.scene.getPlayerPokemon()!;

    game.move.changeMoveset(mrMime, [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ]);
    await game.move.learnMove(Moves.SACRED_FIRE, 0, 4);
    expect(mrMime.getMoveset()).toEqual([ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ]);

  });

});
