import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Mirror Move", () => {
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
      .moveset([MoveId.MIRROR_MOVE, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH)
      .battleStyle("single")
      .criticalHits(false)
      .enemySpecies(SpeciesId.MAGIKARP)
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  it("should use the last move that the target used on the user", async () => {
    game.override.battleStyle("double").enemyMoveset([MoveId.TACKLE, MoveId.GROWL]);
    await game.classicMode.startBattle([SpeciesId.FEEBAS, SpeciesId.MAGIKARP]);

    game.move.select(MoveId.MIRROR_MOVE, 0, BattlerIndex.ENEMY); // target's last move is Tackle, enemy should receive damage from Mirror Move copying Tackle
    game.move.select(MoveId.SPLASH, 1);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.GROWL, BattlerIndex.PLAYER_2);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.scene.getEnemyField()[0].isFullHp()).toBeFalsy();
  });

  it("should apply secondary effects of a move", async () => {
    game.override.enemyMoveset(MoveId.ACID_SPRAY);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon().getStatStage(Stat.SPDEF)).toBe(-2);
  });

  it("should be able to copy status moves", async () => {
    game.override.enemyMoveset(MoveId.GROWL);
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon().getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should fail if the target has not used any moves", async () => {
    await game.classicMode.startBattle([SpeciesId.FEEBAS]);

    game.move.select(MoveId.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
