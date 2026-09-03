import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { BattlerTagType } from "#enums/battler-tag-type";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { StatusEffect } from "#enums/status-effect";
import { GameManager } from "#test/framework/game-manager";
import Phaser from "phaser";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Imprison", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemySpecies(SpeciesId.SHUCKLE)
      .ability(AbilityId.BALL_FETCH);
  });

  it("should prevent opponents from using moves shared by the user", async () => {
    await game.classicMode.startBattle(SpeciesId.REGIELEKI);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.changeMoveset(player, [MoveId.TRANSFORM, MoveId.SPLASH]);
    game.move.changeMoveset(enemy, [MoveId.IMPRISON, MoveId.SPLASH, MoveId.GROWL]);

    game.move.select(MoveId.TRANSFORM);
    await game.move.selectEnemyMove(MoveId.IMPRISON);
    await game.toNextTurn();

    const playerMoveset = player.getMoveset().map(x => x.moveId);
    const enemyMoveset = enemy.getMoveset().map(x => x.moveId);
    expect(enemyMoveset).toContain(playerMoveset[0]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player).toHaveUsedMove(MoveId.STRUGGLE);
  });

  it("should not prevent allies from using moves shared by the user", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MAGIKARP);

    const [player1, player2] = game.scene.getPlayerField();
    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.changeMoveset(player1, [MoveId.IMPRISON, MoveId.SPLASH]);
    game.move.changeMoveset(player2, [MoveId.IMPRISON, MoveId.SPLASH]);
    game.move.changeMoveset(enemy1, [MoveId.SPLASH]);
    game.move.changeMoveset(enemy2, [MoveId.SPLASH]);

    game.move.select(MoveId.IMPRISON, BattlerIndex.PLAYER);
    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toNextTurn();

    expect(player1).toHaveUsedMove({ move: MoveId.IMPRISON, result: MoveResult.SUCCESS });
    expect(player2).toHaveUsedMove({ move: MoveId.SPLASH, result: MoveResult.SUCCESS });
    expect(enemy1).toHaveUsedMove({ move: MoveId.NONE, result: MoveResult.FAIL });
    expect(enemy2).toHaveUsedMove({ move: MoveId.NONE, result: MoveResult.FAIL });
  });

  it("should not interrupt moves invoked by Sleep Talk", async () => {
    game.override.enemyStatusEffect(StatusEffect.SLEEP);
    await game.classicMode.startBattle(SpeciesId.FEEBAS);

    const player = game.field.getPlayerPokemon();
    const enemy = game.field.getEnemyPokemon();

    game.move.changeMoveset(player, [MoveId.IMPRISON, MoveId.SPLASH]);
    game.move.changeMoveset(enemy, [MoveId.SPLASH, MoveId.SLEEP_TALK]);

    game.move.select(MoveId.IMPRISON);
    await game.move.selectEnemyMove(MoveId.SLEEP_TALK);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(enemy).toHaveUsedMove({ move: MoveId.SPLASH, result: MoveResult.SUCCESS, useMode: MoveUseMode.FOLLOW_UP });
  });

  it("should not interfere with the effects of an ally's Imprison", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MAGIKARP);

    const [player1, player2] = game.scene.getPlayerField();
    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.changeMoveset(player1, [MoveId.IMPRISON, MoveId.SPLASH]);
    game.move.changeMoveset(player2, [MoveId.IMPRISON, MoveId.CELEBRATE]);
    game.move.changeMoveset(enemy1, [MoveId.SPLASH, MoveId.CELEBRATE]);
    game.move.changeMoveset(enemy2, [MoveId.SPLASH, MoveId.CELEBRATE]);

    game.move.select(MoveId.IMPRISON, BattlerIndex.PLAYER);
    game.move.select(MoveId.IMPRISON, BattlerIndex.PLAYER_2);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.toNextTurn();

    expect(enemy1).toHaveBattlerTag(BattlerTagType.IMPRISON);
    expect(enemy2).toHaveBattlerTag(BattlerTagType.IMPRISON);
    expect(enemy1).toHaveUsedMove({ move: MoveId.NONE, result: MoveResult.FAIL });
    expect(enemy2).toHaveUsedMove({ move: MoveId.NONE, result: MoveResult.FAIL });

    game.move.select(MoveId.SPLASH, BattlerIndex.PLAYER);
    game.move.select(MoveId.CELEBRATE, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    expect(enemy1).toHaveUsedMove(MoveId.STRUGGLE);
    expect(enemy2).toHaveUsedMove(MoveId.STRUGGLE);
  });

  it("should disable matching moves for opponents that enter the field afterward", async () => {
    await game.classicMode.startBattle(SpeciesId.FEEBAS, SpeciesId.MAGIKARP);

    const [player1, player2] = game.scene.getPlayerParty();
    const enemy = game.field.getEnemyPokemon();

    game.move.changeMoveset(player1, [MoveId.SPLASH, MoveId.GROWL]);
    game.move.changeMoveset(player2, [MoveId.SPLASH, MoveId.GROWL]);
    game.move.changeMoveset(enemy, [MoveId.IMPRISON, MoveId.SPLASH, MoveId.GROWL]);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.IMPRISON);
    await game.toNextTurn();

    game.doSwitchPokemon(1);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toNextTurn();

    expect(player2.isOnField()).toBe(true);

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.toEndOfTurn();

    expect(player2).toHaveUsedMove(MoveId.STRUGGLE);
  });
});
