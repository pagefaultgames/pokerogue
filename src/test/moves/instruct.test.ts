import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { BattlerIndex } from "#app/battle";
import GameManager from "#test/utils/gameManager";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#app/enums/abilities";
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
    game.override.enemyAbility(Abilities.COMPOUND_EYES);
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

    // lost 40 hp from 2 attacks
    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40);
    const moveUsed = game.scene.getEnemyPokemon()?.moveset.find(m => m?.moveId === Moves.SONIC_BOOM)!;

    // used 2 pp due to spanking enemy twice
    expect(moveUsed.ppUsed).toBe(2);

  });
  it("should not repeat enemy's out of pp move", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);
    const enemyPokemon = game.scene.getEnemyPokemon();
    const moveUsed = enemyPokemon?.moveset.find(m => m?.moveId === Moves.SONIC_BOOM)!;
    moveUsed.ppUsed = moveUsed.getMovePp() - 1; // deduct all but 1 pp

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // 2nd move call fails due to out of pp
    expect(game.scene.getPlayerPokemon()?.getLastXMoves().at(-1)!.result).toBe(MoveResult.SUCCESS);
    expect(enemyPokemon?.getLastXMoves().at(-1)!.result).toBe(MoveResult.FAIL);

    // move used all its remaining pp
    expect(moveUsed.ppUsed).toBe(moveUsed.getMovePp());

  });
  it("should not repeat enemy's attack move when moving first", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // should fail to execute due to lack of move
    expect(game.scene.getPlayerPokemon()!.getLastXMoves().at(-1)!.result).toBe(MoveResult.FAIL);
  });
  it("should repeat enemy's move through substitute", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SUBSTITUTE, BattlerIndex.ATTACKER);
    await game.setTurnOrder([ BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);
    await game.phaseInterceptor.to("CommandPhase", false);

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // lost 40 hp from 2 attacks
    expect(game.scene.getPlayerPokemon()?.getInverseHp()).toBe(40);
  });
  it("should try to repeat enemy's disabled move, but fail", async () => {
    game.override.moveset([ Moves.INSTRUCT, Moves.SONIC_BOOM, Moves.DISABLE, Moves.SPLASH ]);
    await game.classicMode.startBattle([ Species.AMOONGUSS, Species.DROWZEE ]);
    game.move.select(Moves.DISABLE, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.SONIC_BOOM, BattlerIndex.PLAYER);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2 ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // instruction should succeed but move itself should fail
    expect(game.scene.getPlayerPokemon()!.getLastXMoves().at(-1)!.result).toBe(MoveResult.SUCCESS);
    expect(game.scene.getEnemyPokemon()!.getLastXMoves().at(-1)!.result).toBe(MoveResult.FAIL);
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

    // instruct and repeated move should work correctly
    expect(game.scene.getPlayerPokemon()!.getLastXMoves().at(-1)!.result).toBe(MoveResult.SUCCESS);
    expect(game.scene.getEnemyPokemon()!.getLastXMoves().at(-1)!.result).toBe(MoveResult.SUCCESS);
  });
  it("should not repeat enemy's move through protect", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS ]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    // fake move history
    enemyPokemon.battleSummonData.moveHistory = [{ move: Moves.SONIC_BOOM, targets: [ BattlerIndex.PLAYER ], result: MoveResult.SUCCESS, virtual: false }];

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.PROTECT);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // lost no hp as mon protected themself from instruct
    expect(game.scene.getPlayerPokemon()!.getLastXMoves().at(-1)!.result).toBe(MoveResult.FAIL);
  });
  it("should not repeat enemy's charging move", async () => {
    await game.classicMode.startBattle([ Species.DUSKNOIR ]);
    const enemyPokemon = game.scene.getEnemyPokemon()!;
    enemyPokemon.battleSummonData.moveHistory = [{ move: Moves.SONIC_BOOM, targets: [ BattlerIndex.PLAYER ], result: MoveResult.SUCCESS, virtual: false }];

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.HYPER_BEAM);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // hyper beam charging prevented instruct from working
    expect(game.scene.getPlayerPokemon()!.getLastXMoves().at(-1)!.result).toBe(MoveResult.FAIL);

    await game.phaseInterceptor.to("CommandPhase", false);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.HYPER_BEAM);
    await game.setTurnOrder([ BattlerIndex.ENEMY, BattlerIndex.PLAYER ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // hyper beam charging prevented instruct from working
    expect(game.scene.getPlayerPokemon()!.getLastXMoves().at(-1)!.result).toBe(MoveResult.FAIL);

  });
  it("should not repeat dance move not known by target", async () => {
    await game.classicMode.startBattle([ Species.DUSKNOIR, Species.ABOMASNOW ]);
    game.override.moveset([ Moves.INSTRUCT, Moves.FIERY_DANCE, Moves.SUBSTITUTE, Moves.TORMENT ]);
    game.override.enemyAbility(Abilities.DANCER);
    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.FIERY_DANCE, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.PROTECT, BattlerIndex.ATTACKER);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);
    await game.phaseInterceptor.to("TurnEndPhase", false);

    // Pokemon 2 uses dance; dancer reciprocates
    // instruct fails as it cannot copy the dance move
    expect(game.scene.getPlayerPokemon()!.getLastXMoves().at(-1)!.result).toBe(MoveResult.FAIL);
  });
  it("should repeat ally's attack on enemy", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS, Species.SHUCKLE ]);

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.select(Moves.SONIC_BOOM, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY);
    await game.forceEnemyMove(Moves.VINE_WHIP);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

    await game.phaseInterceptor.to("TurnEndPhase", false);

    // used 2 pp and spanked enemy twice
    const moveUsed = game.scene.getPlayerField()[1]!.getMoveset().find(m => m?.moveId === Moves.SONIC_BOOM)!;
    expect(moveUsed.ppUsed).toBe(2);
    expect(game.scene.getEnemyPokemon()!.getInverseHp()).toBe(40);

  });
  it("should repeat ally's friendly fire attack", async () => {
    await game.classicMode.startBattle([ Species.AMOONGUSS, Species.SHUCKLE ]);

    game.move.select(Moves.INSTRUCT, BattlerIndex.PLAYER, BattlerIndex.PLAYER_2);
    game.move.select(Moves.SONIC_BOOM, BattlerIndex.PLAYER_2, BattlerIndex.PLAYER);
    await game.forceEnemyMove(Moves.VINE_WHIP, BattlerIndex.PLAYER_2);
    await game.setTurnOrder([ BattlerIndex.PLAYER_2, BattlerIndex.PLAYER, BattlerIndex.ENEMY ]);

    await game.phaseInterceptor.to("TurnEndPhase", false);

    const playerPokemon = game.scene.getPlayerField()[0]!;
    expect(playerPokemon.getInverseHp()).toBe(40); // spanked ally twice
  });
});
