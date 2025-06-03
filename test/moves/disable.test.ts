import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { MoveUseType } from "#enums/move-use-type";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import { Stat } from "#enums/stat";
import GameManager from "#test/testUtils/gameManager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Disable", () => {
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

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    game.override
      .battleStyle("single")
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([Moves.DISABLE, Moves.SPLASH])
      .enemyMoveset(Moves.SPLASH)
      .enemySpecies(Species.SHUCKLE);
  });

  it("should restrict the last move used", async () => {
    await game.classicMode.startBattle([Species.PIKACHU]);

    const enemyMon = game.field.getEnemyPokemon();

    game.move.select(Moves.SPLASH);
    await game.move.forceEnemyMove(Moves.GROWL);
    await game.toNextTurn();

    game.move.select(Moves.DISABLE);
    await game.move.forceEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyMon.getLastXMoves(-1)).toHaveLength(2);
    expect(enemyMon.isMoveRestricted(Moves.SPLASH)).toBe(true);
    expect(enemyMon.isMoveRestricted(Moves.GROWL)).toBe(false);
  });

  it("should fail if enemy has no move history", async () => {
    await game.classicMode.startBattle([Species.PIKACHU]);

    const playerMon = game.field.getPlayerPokemon();
    const enemyMon = game.field.getEnemyPokemon();

    game.move.select(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(playerMon.getLastXMoves()[0]).toMatchObject({
      move: Moves.DISABLE,
      result: MoveResult.FAIL,
    });
    expect(enemyMon.isMoveRestricted(Moves.SPLASH)).toBe(false);
  });

  it("causes STRUGGLE if all usable moves are disabled", async () => {
    await game.classicMode.startBattle([Species.PIKACHU]);

    const enemyMon = game.field.getEnemyPokemon();

    game.move.select(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    const enemyHistory = enemyMon.getLastXMoves(-1);
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory.map(m => m.move)).toEqual([Moves.STRUGGLE, Moves.SPLASH]);
  });

  it("should fail if it would otherwise disable struggle", async () => {
    await game.classicMode.startBattle([Species.PIKACHU]);

    const playerMon = game.field.getPlayerPokemon();
    const enemyMon = game.field.getEnemyPokemon();

    game.move.select(Moves.DISABLE);
    await game.move.forceEnemyMove(Moves.STRUGGLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(playerMon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(enemyMon.getLastXMoves()[0].move).toBe(Moves.STRUGGLE);
    expect(enemyMon.isMoveRestricted(Moves.STRUGGLE)).toBe(false);
  });

  it("should interrupt target's move if used first", async () => {
    await game.classicMode.startBattle([Species.PIKACHU]);

    const enemyMon = game.field.getEnemyPokemon();
    // add splash to enemy move history
    enemyMon.pushMoveHistory({
      move: Moves.SPLASH,
      targets: [BattlerIndex.ENEMY],
      useType: MoveUseType.NORMAL,
    });

    game.move.select(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const enemyHistory = enemyMon.getLastXMoves(-1);
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory[0].result).toBe(MoveResult.FAIL);
  });

  it.each([
    { name: "Nature Power", moveId: Moves.NATURE_POWER },
    { name: "Mirror Move", moveId: Moves.MIRROR_MOVE },
    { name: "Copycat", moveId: Moves.COPYCAT },
    { name: "Metronome", moveId: Moves.METRONOME },
  ])("should ignore virtual moves called by $name", async ({ moveId }) => {
    game.override.enemyMoveset(moveId);
    await game.classicMode.startBattle([Species.PIKACHU]);

    const playerMon = game.scene.getPlayerPokemon()!;
    playerMon.pushMoveHistory({ move: Moves.SPLASH, targets: [BattlerIndex.ENEMY], useType: MoveUseType.NORMAL });
    game.scene.currentBattle.lastMove = Moves.SPLASH;

    game.move.select(Moves.DISABLE);
    await game.move.forceEnemyMove(moveId);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    const enemyMon = game.scene.getEnemyPokemon()!;
    expect(enemyMon.isMoveRestricted(moveId), `calling move ${Moves[moveId]} was not disabled`).toBe(true);
    expect(enemyMon.getLastXMoves(-1)).toHaveLength(2);
    const calledMove = enemyMon.getLastXMoves()[0].move;
    expect(
      enemyMon.isMoveRestricted(calledMove),
      `called move ${Moves[calledMove]} (from ${Moves[moveId]}) was incorrectly disabled`,
    ).toBe(false);
  });


  it("should ignore dancer copied moves, even if also in moveset", async () => {
    game.override
      .enemyAbility(Abilities.DANCER)
      .moveset([Moves.DISABLE, Moves.SWORDS_DANCE])
      .enemyMoveset([Moves.SPLASH, Moves.SWORDS_DANCE]);
    await game.classicMode.startBattle([Species.PIKACHU]);

    game.move.select(Moves.SWORDS_DANCE);
    await game.move.selectEnemyMove(Moves.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(Moves.DISABLE);
    await game.move.selectEnemyMove(Moves.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();
 
    // Dancer-induced Swords Dance was ignored in favor of splash,
    // leaving the subsequent _normal_ swords dance free to work as normal
    const shuckle = game.field.getEnemyPokemon();
    expect.soft(shuckle.isMoveRestricted(Moves.SPLASH)).toBe(true);
    expect.soft(shuckle.isMoveRestricted(Moves.SWORDS_DANCE)).toBe(false);
    expect(shuckle.getLastXMoves()[0]).toMatchObject({ move: Moves.SWORDS_DANCE, result: MoveResult.SUCCESS });
    expect(shuckle.getStatStage(Stat.ATK)).toBe(4);
  });
});
