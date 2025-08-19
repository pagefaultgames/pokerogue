import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Copycat", () => {
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
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should copy the last move successfully executed by any Pokemon", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.COPYCAT);
    await game.move.forceEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toEndOfTurn();

    const player = game.field.getPlayerPokemon();
    expect(player).toHaveStatStage(Stat.ATK, 2);
    expect(player).toHaveUsedMove({ move: MoveId.SWORDS_DANCE, useMode: MoveUseMode.FOLLOW_UP });
  });

  // TODO: Enable once move phase is refactored
  it.todo('should update "last move" tracker for moves failing conditions, but not pre-move interrupts', async () => {
    game.override.enemyStatusEffect(StatusEffect.SLEEP);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.SUCKER_PUNCH);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.phaseInterceptor.to("MoveEndPhase");

    // Enemy is asleep and should not have updated tracker
    expect(game.scene.currentBattle.lastMove).toBe(MoveId.NONE);

    await game.phaseInterceptor.to("MoveEndPhase");

    // Player sucker punch failed conditions, but still updated tracker
    expect(game.scene.currentBattle.lastMove).toBe(MoveId.SUCKER_PUNCH);

    const player = game.field.getPlayerPokemon();
    expect(player.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if no prior moves have been made", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.COPYCAT);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should fail if the last move used is not a valid Copycat move", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.COPYCAT);
    await game.move.forceEnemyMove(MoveId.PROTECT);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should copy the called move when the last move successfully calls another", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.METRONOME);
    game.move.forceMetronomeMove(MoveId.SWORDS_DANCE, true);
    await game.move.forceEnemyMove(MoveId.COPYCAT);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]); // Player moves first, so enemy can copy Swords Dance
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.ATK, 2);
  });

  it("should apply move secondary effects", async () => {
    game.override.enemyMoveset(MoveId.ACID_SPRAY); // Secondary effect lowers SpDef by 2 stages
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.use(MoveId.COPYCAT);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon()).toHaveStatStage(Stat.SPDEF, -2);
  });
});
