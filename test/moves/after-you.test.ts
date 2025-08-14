import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { MovePhase } from "#phases/move-phase";
import { GameManager } from "#test/test-utils/game-manager";
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
      .enemySpecies(SpeciesId.PIKACHU)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH)
      .ability(AbilityId.BALL_FETCH)
      .moveset([MoveId.AFTER_YOU, MoveId.SPLASH]);
  });

  it("makes the target move immediately after the user", async () => {
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.SHUCKLE]);

    game.move.select(MoveId.AFTER_YOU, 0, BattlerIndex.PLAYER_2);
    game.move.select(MoveId.SPLASH, 1);

    await game.phaseInterceptor.to("MoveEffectPhase");
    await game.phaseInterceptor.to(MovePhase, false);
    const phase = game.scene.phaseManager.getCurrentPhase() as MovePhase;
    expect(phase.pokemon).toBe(game.scene.getPlayerField()[1]);
    await game.phaseInterceptor.to("MoveEndPhase");
  });

  it("fails if target already moved", async () => {
    game.override.enemySpecies(SpeciesId.SHUCKLE);
    await game.classicMode.startBattle([SpeciesId.REGIELEKI, SpeciesId.PIKACHU]);

    game.move.select(MoveId.SPLASH);
    game.move.select(MoveId.AFTER_YOU, 1, BattlerIndex.PLAYER);

    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to("MoveEndPhase");
    await game.phaseInterceptor.to(MovePhase);

    expect(game.scene.getPlayerField()[1].getLastXMoves(1)[0].result).toBe(MoveResult.FAIL);
  });

  // TODO: Enable once rampaging moves and move queue are fixed.
  // Currently does literally nothing because `MoveUseMode` is overridden from move queue
  // within `MovePhase`, but should be enabled once that jank is removed
  it.todo("should maintain PP ignore status of rampaging moves", async () => {
    game.override.moveset([]);
    await game.classicMode.startBattle([SpeciesId.ACCELGOR, SpeciesId.RATTATA]);

    const [accelgor, rattata] = game.scene.getPlayerField();
    expect(accelgor).toBeDefined();
    expect(rattata).toBeDefined();

    game.move.changeMoveset(accelgor, [MoveId.SPLASH, MoveId.AFTER_YOU]);
    game.move.changeMoveset(rattata, MoveId.OUTRAGE);

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.OUTRAGE, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    const outrageMove = rattata.getMoveset().find(m => m.moveId === MoveId.OUTRAGE);
    expect(outrageMove?.ppUsed).toBe(1);

    game.move.select(MoveId.AFTER_YOU, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    await game.phaseInterceptor.to("TurnEndPhase");

    expect(accelgor.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS);
    expect(outrageMove?.ppUsed).toBe(1);
    expect(rattata.getLastXMoves()[0]).toMatchObject({
      move: MoveId.OUTRAGE,
      result: MoveResult.SUCCESS,
      useMode: MoveUseMode.IGNORE_PP,
    });
  });
});
