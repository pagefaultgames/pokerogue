import { BattlerIndex } from "#app/battle";
import { Stat } from "#app/enums/stat";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
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
      .moveset([ Moves.MIRROR_MOVE, Moves.SPLASH ])
      .ability(Abilities.BALL_FETCH)
      .battleType("single")
      .disableCrits()
      .enemySpecies(Species.MAGIKARP)
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  it("should use the last move targeted at the user", async () => {
    game.override.enemyMoveset(Moves.TACKLE);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.MIRROR_MOVE);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()!.isFullHp()).toBeFalsy();
  });

  it("should apply secondary effects of a move", async () => {
    game.override.enemyMoveset(Moves.ACID_SPRAY);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.MIRROR_MOVE);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.SPDEF)).toBe(-2);
  });

  it("should fail if the user has never been targeted", { repeats: 10 }, async () => {
    game.override
      .battleType("double")
      .startingLevel(100)
      .enemyMoveset([ Moves.TACKLE, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.FEEBAS, Species.MAGIKARP ]);

    game.move.select(Moves.MIRROR_MOVE);
    game.move.select(Moves.SPLASH, 1);
    await game.forceEnemyMove(Moves.TACKLE, BattlerIndex.PLAYER_2);
    await game.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.ENEMY_2, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER ]);
    await game.toNextTurn();

    expect(game.scene.getPlayerField()![0].getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should copy status moves that target the user", async () => {
    game.override.enemyMoveset(Moves.GROWL);
    await game.classicMode.startBattle([ Species.FEEBAS ]);

    game.move.select(Moves.MIRROR_MOVE);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()!.getStatStage(Stat.ATK)).toBe(-1);
  });
});
