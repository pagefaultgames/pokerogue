import { Button } from "#enums/buttons";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { UiMode } from "#enums/ui-mode";
import { LearnMovePhase } from "#phases/learn-move-phase";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
    game.override.moveset([MoveId.SPLASH]);
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const pokemon = game.field.getPlayerPokemon();
    const newMovePos = pokemon?.getMoveset().length;
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();
    await game.phaseInterceptor.to(LearnMovePhase);
    const levelMove = pokemon.getLevelMoves(5)[0];
    const levelReq = levelMove[0];
    const levelMoveId = levelMove[1];
    expect(pokemon.level).toBeGreaterThanOrEqual(levelReq);
    expect(pokemon?.moveset[newMovePos]?.moveId).toBe(levelMoveId);
  });

  it("If a pokemon has 4 move slots filled, the chosen move will be deleted and replaced", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const bulbasaur = game.field.getPlayerPokemon();
    const prevMoveset = [MoveId.SPLASH, MoveId.ABSORB, MoveId.ACID, MoveId.VINE_WHIP];
    const moveSlotNum = 3;

    game.move.changeMoveset(bulbasaur, prevMoveset);
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();

    // queue up inputs to confirm dialog boxes
    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(moveSlotNum);
      game.scene.ui.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.to(LearnMovePhase);

    const levelMove = bulbasaur.getLevelMoves(5)[0];
    const levelReq = levelMove[0];
    const levelMoveId = levelMove[1];
    expect(bulbasaur.level).toBeGreaterThanOrEqual(levelReq);
    // Check each of mr mime's moveslots to make sure the changed move (and ONLY the changed move) is different
    bulbasaur.getMoveset().forEach((move, index) => {
      const expectedMove: MoveId = index === moveSlotNum ? levelMoveId : prevMoveset[index];
      expect(move?.moveId).toBe(expectedMove);
    });
  });

  it("selecting the newly deleted move will reject it and keep old moveset", async () => {
    await game.classicMode.startBattle([SpeciesId.BULBASAUR]);
    const bulbasaur = game.field.getPlayerPokemon();
    const prevMoveset = [MoveId.SPLASH, MoveId.ABSORB, MoveId.ACID, MoveId.VINE_WHIP];

    game.move.changeMoveset(bulbasaur, [MoveId.SPLASH, MoveId.ABSORB, MoveId.ACID, MoveId.VINE_WHIP]);
    game.move.select(MoveId.SPLASH);
    await game.doKillOpponents();

    // queue up inputs to confirm dialog boxes
    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.SUMMARY, () => {
      game.scene.ui.setCursor(4);
      game.scene.ui.processInput(Button.ACTION);
    });
    game.onNextPrompt("LearnMovePhase", UiMode.CONFIRM, () => {
      game.scene.ui.processInput(Button.ACTION);
    });
    await game.phaseInterceptor.to(LearnMovePhase);

    const levelReq = bulbasaur.getLevelMoves(5)[0][0];
    expect(bulbasaur.level).toBeGreaterThanOrEqual(levelReq);
    expect(bulbasaur.getMoveset().map(m => m?.moveId)).toEqual(prevMoveset);
  });
});
