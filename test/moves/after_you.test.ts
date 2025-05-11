import { BattlerIndex } from "#app/battle";
import { Abilities } from "#app/enums/abilities";
import { MoveResult } from "#app/field/pokemon";
import { MovePhase } from "#app/phases/move-phase";
import { MoveUseType } from "#enums/move-use-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - After You", () => {
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
      .battleStyle("double")
      .enemyLevel(5)
      .enemySpecies(Species.PIKACHU)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH)
      .ability(Abilities.BALL_FETCH)
      .moveset([Moves.AFTER_YOU, Moves.SPLASH]);
  });

  it("makes the target move immediately after the user", async () => {
    await game.classicMode.startBattle([Species.REGIELEKI, Species.SHUCKLE]);

    game.move.select(Moves.AFTER_YOU, 0, BattlerIndex.PLAYER_2);
    game.move.select(Moves.SPLASH, 1);

    await game.phaseInterceptor.to("MoveEffectPhase");
    await game.phaseInterceptor.to(MovePhase, false);
    const phase = game.scene.getCurrentPhase() as MovePhase;
    expect(phase.pokemon).toBe(game.scene.getPlayerField()[1]);
    await game.phaseInterceptor.to("MoveEndPhase");
  });

  it("fails if target already moved", async () => {
    game.override.enemySpecies(Species.SHUCKLE);
    await game.classicMode.startBattle([Species.REGIELEKI, Species.PIKACHU]);

    game.move.select(Moves.SPLASH);
    game.move.select(Moves.AFTER_YOU, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to(MovePhase);

    expect(game.scene.getPlayerField()[1].getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
  });

  // TODO: Enable once rampaging moves and move queue are fixed.
  // Currently does literally nothing because `MoveUseType` is overridden from move queue
  // within `MovePhase`, but should be enabled once that jank is removed
  it.todo("should maintain PP ignore status of rampaging moves", async () => {
    game.override.moveset([]);
    await game.classicMode.startBattle([Species.ACCELGOR, Species.RATTATA]);

    const [accelgor, rattata] = game.scene.getPlayerField();
    expect(accelgor).toBeDefined();
    expect(rattata).toBeDefined();

    game.move.changeMoveset(accelgor, [Moves.SPLASH, Moves.AFTER_YOU]);
    game.move.changeMoveset(rattata, Moves.OUTRAGE);

    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER);
    game.move.select(Moves.OUTRAGE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    const outrageMove = rattata.getMoveset().find(m => m.moveId === Moves.OUTRAGE);
    expect(outrageMove?.ppUsed).toBe(1);

    game.move.select(Moves.AFTER_YOU, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(accelgor.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(outrageMove?.ppUsed).toBe(1);
    expect(rattata.getLastXMoves()[0]).toMatchObject({
      move: Moves.OUTRAGE,
      result: MoveResult.SUCCESS,
      useType: MoveUseType.IGNORE_PP,
    });
  });
});
