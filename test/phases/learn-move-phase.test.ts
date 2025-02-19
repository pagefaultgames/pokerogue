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
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const bulbasaur = game.scene.getPlayerPokemon()!;
    const prevMoveset = [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ];
    const moveSlotNum = 3;

    game.move.changeMoveset(bulbasaur, prevMoveset);
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

    const levelMove = bulbasaur.getLevelMoves(5)[0];
    const levelReq = levelMove[0];
    const levelMoveId = levelMove[1];
    expect(bulbasaur.level).toBeGreaterThanOrEqual(levelReq);
    // Check each of mr mime's moveslots to make sure the changed move (and ONLY the changed move) is different
    bulbasaur.getMoveset().forEach((move, index) => {
      const expectedMove: Moves = (index === moveSlotNum ? levelMoveId : prevMoveset[index]);
      expect(move?.moveId).toBe(expectedMove);
    });
  });

  it("selecting the newly deleted move will reject it and keep old moveset", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const bulbasaur = game.scene.getPlayerPokemon()!;
    const prevMoveset = [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ];

    game.move.changeMoveset(bulbasaur, [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ]);
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

    const levelReq = bulbasaur.getLevelMoves(5)[0][0];
    expect(bulbasaur.level).toBeGreaterThanOrEqual(levelReq);
    expect(bulbasaur.getMoveset().map(m => m?.moveId)).toEqual(prevMoveset);
  });

  it("macro should add moves in free slots normally", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const bulbasaur = game.scene.getPlayerPokemon()!;

    game.move.changeMoveset(bulbasaur, [ Moves.SPLASH, Moves.ABSORB, Moves.ACID ]);
    game.move.select(Moves.SPLASH);
    await game.move.learnMove(Moves.SACRED_FIRE, 0, 1);
    expect(bulbasaur.getMoveset().map(m => m?.moveId)).toEqual([ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.SACRED_FIRE ]);

  });

  it("macro should replace moves", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const bulbasaur = game.scene.getPlayerPokemon()!;

    game.move.changeMoveset(bulbasaur, [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ]);
    game.move.select(Moves.SPLASH);
    await game.move.learnMove(Moves.SACRED_FIRE, 0, 1);
    expect(bulbasaur.getMoveset().map(m => m?.moveId)).toEqual([ Moves.SPLASH, Moves.SACRED_FIRE, Moves.ACID, Moves.VINE_WHIP ]);

  });

  it("macro should allow for cancelling move learning", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR ]);
    const bulbasaur = game.scene.getPlayerPokemon()!;

    game.move.changeMoveset(bulbasaur, [ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ]);
    game.move.select(Moves.SPLASH);
    await game.move.learnMove(Moves.SACRED_FIRE, 0, 4);
    expect(bulbasaur.getMoveset().map(m => m?.moveId)).toEqual([ Moves.SPLASH, Moves.ABSORB, Moves.ACID, Moves.VINE_WHIP ]);

  });

  it("macro works on off-field party members", async () => {
    await game.classicMode.startBattle([ Species.BULBASAUR, Species.SQUIRTLE ]);
    const squirtle = game.scene.getPlayerParty()[1]!;

    game.move.changeMoveset(squirtle, [ Moves.SPLASH, Moves.WATER_GUN, Moves.FREEZE_DRY, Moves.GROWL ]);
    game.move.select(Moves.TACKLE);
    await game.move.learnMove(Moves.SHELL_SMASH, 1, 0);
    expect(squirtle.getMoveset().map(m => m?.moveId)).toEqual([ Moves.SHELL_SMASH, Moves.WATER_GUN, Moves.FREEZE_DRY, Moves.GROWL ]);

  });

});
