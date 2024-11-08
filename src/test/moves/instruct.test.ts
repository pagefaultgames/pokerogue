import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle";
import GameManager from "#test/utils/gameManager";
import { MoveResult } from "#app/field/pokemon";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Instruct", () => {
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
    game.override.battleType("double");
    game.override.enemySpecies(Species.MAGIKARP);
    game.override.battleType("double");
    game.override.enemyLevel(100);
    game.override.starterSpecies(Species.AMOONGUSS);
    game.override.startingLevel(100);
    game.override.moveset([ Moves.INSTRUCT, Moves.SONIC_BOOM, Moves.SUBSTITUTE, Moves.TORMENT ]);
    game.override.enemyMoveset([ Moves.SONIC_BOOM, Moves.PROTECT, Moves.SUBSTITUTE, Moves.HYPER_BEAM ]);
  });

  it("should repeat enemy's attack move when moving last", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40); // lost 2 hp from 2 attacks
  });
  it("should repeat enemy's move through substitute", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SUBSTITUTE, BattlerIndex.ATTACKER);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("CommandPhase", false);

    // fake move history

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40); // lost 40 hp from 2 attacks
  });
  it("should try to repeat enemy's disabled move, but fail", async () => {
    game.override.moveset([ Moves.INSTRUCT, Moves.SONIC_BOOM, Moves.DISABLE, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.AMOONGUSS, Species.DROWZEE ]);
    game.move.select(Moves.DISABLE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2 ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getEnemyPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL); // failed due to disable
  });
  it("should repeat tormented enemy's move", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS, Species.MIGHTYENA ]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    // fake move history
    enemyPokemon.battleSummonData.moveHistory = [{ move: Moves.SONIC_BOOM, targets: [ BattlerIndex.PLAYER ], result: MoveResult.SUCCESS, virtual: false }];

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.TORMENT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SONIC_BOOM);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.SUCCESS); // should work
  });
  it("should not repeat enemy's move thru protect", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    // fake move history
    enemyPokemon.battleSummonData.moveHistory = [{ move: Moves.SONIC_BOOM, targets: [ BattlerIndex.PLAYER ], result: MoveResult.SUCCESS, virtual: false }];

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.PROTECT);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL); // lost no hp as mon protected themself from instruct
  });
  it("should not repeat enemy's charging move", async () => {
    await game.classicMode.startBattle([ Species.DUSKNOIR ]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.battleSummonData.moveHistory = [{ move: Moves.SONIC_BOOM, targets: [ BattlerIndex.PLAYER ], result: MoveResult.SUCCESS, virtual: false }];

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.HYPER_BEAM);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL); // hyper beam charging prevented instruct from working
  });
  it("should not repeat move not known by target", async () => {
    await game.classicMode.startBattle([ Species.DUSKNOIR ]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.battleSummonData.moveHistory = [{ move: Moves.ROLLOUT, targets: [ BattlerIndex.PLAYER ], result: MoveResult.SUCCESS, virtual: false }];

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.HYPER_BEAM);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL); // hyper beam cannot be instructed
  });
  it("should repeat ally's attack on enemy", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS, Species.SHUCKLE ]);

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.select(Moves.SONIC_BOOM, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.VINE_WHIP);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

    await game.phaseInterceptor.to("TurnEndPhase", false);

    const moveUsed = game.scene.getPlayerField()[1]!.getMoveset().find(m => m?.moveId === Moves.SONIC_BOOM)!;
    expect(moveUsed.getMove().pp - moveUsed.getMovePp()).toBe(2); // used 2 pp and spanked enemy twice
  });
});
