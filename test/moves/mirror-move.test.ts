import { BattlerIndex } from "#app/battle";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/testUtils/gameManager";
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
      .moveset([Moves.MIRROR_MOVE, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH)
      .battleStyle("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should use the last move that the target used on the user", async () => {
    game.override.battleStyle("double").enemyMoveset([Moves.TACKLE, Moves.GROWL]);
    await game.classicMode.startBattle([Species.FEEBAS, Species.MAGIKARP]);

    game.move.select(Moves.MIRROR_MOVE, 0, BattlerIndex.ENEMY); // target's last move is Tackle, enemy should receive damage from Mirror Move copying Tackle
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.GROWL, BattlerIndex.PLAYER_2);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.scene.getEnemyField()[0].isFullHp()).toBeFalsy();
  });

  it("should apply secondary effects of a move", async () => {
    game.override.enemyMoveset(Moves.ACID_SPRAY);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.SPDEF)).toBe(-2);
  });

  it("should be able to copy status moves", async () => {
    game.override.enemyMoveset(Moves.GROWL);
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });

  it("should fail if the target has not used any moves", async () => {
    await game.classicMode.startBattle([Species.FEEBAS]);

    game.move.select(Moves.MIRROR_MOVE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
