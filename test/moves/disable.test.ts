import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { MoveUseMode } from "#enums/move-use-mode";
import { SpeciesId } from "#enums/species-id";
import { Stat } from "#enums/stat";
import { RandomMoveAttr } from "#moves/move";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

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
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([MoveId.DISABLE, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH)
      .enemySpecies(SpeciesId.SHUCKLE);
  });

  it("should restrict the last move used", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const enemyMon = game.field.getEnemyPokemon();

    game.move.select(MoveId.SPLASH);
    await game.move.forceEnemyMove(MoveId.GROWL);
    await game.toNextTurn();

    game.move.select(MoveId.DISABLE);
    await game.move.forceEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyMon.getLastXMoves(-1)).toHaveLength(2);
    expect(enemyMon.isMoveRestricted(MoveId.SPLASH)).toBe(true);
    expect(enemyMon.isMoveRestricted(MoveId.GROWL)).toBe(false);
  });

  it("should fail if enemy has no move history", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const playerMon = game.field.getPlayerPokemon();
    const enemyMon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(playerMon.getLastXMoves()[0]).toMatchObject({
      move: MoveId.DISABLE,
      result: MoveResult.FAIL,
    });
    expect(enemyMon.isMoveRestricted(MoveId.SPLASH)).toBe(false);
  });

  it("causes STRUGGLE if all usable moves are disabled", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const enemyMon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    const enemyHistory = enemyMon.getLastXMoves(-1);
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory.map(m => m.move)).toEqual([MoveId.STRUGGLE, MoveId.SPLASH]);
  });

  it("should fail if it would otherwise disable struggle", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const playerMon = game.field.getPlayerPokemon();
    const enemyMon = game.field.getEnemyPokemon();

    game.move.select(MoveId.DISABLE);
    await game.move.forceEnemyMove(MoveId.STRUGGLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(playerMon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(enemyMon.getLastXMoves()[0].move).toBe(MoveId.STRUGGLE);
    expect(enemyMon.isMoveRestricted(MoveId.STRUGGLE)).toBe(false);
  });

  it("should interrupt target's move if used first", async () => {
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const enemyMon = game.field.getEnemyPokemon();
    // add splash to enemy move history
    enemyMon.pushMoveHistory({
      move: MoveId.SPLASH,
      targets: [BattlerIndex.ENEMY],
      useMode: MoveUseMode.NORMAL,
    });

    game.move.select(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const enemyHistory = enemyMon.getLastXMoves(-1);
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory[0].result).toBe(MoveResult.FAIL);
  });

  it.each([
    { name: "Nature Power", moveId: MoveId.NATURE_POWER },
    { name: "Mirror Move", moveId: MoveId.MIRROR_MOVE },
    { name: "Copycat", moveId: MoveId.COPYCAT },
    { name: "Metronome", moveId: MoveId.METRONOME },
  ])("should ignore virtual moves called by $name", async ({ moveId }) => {
    vi.spyOn(RandomMoveAttr.prototype, "getMoveOverride").mockReturnValue(MoveId.ABSORB);
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    const playerMon = game.field.getPlayerPokemon();
    playerMon.pushMoveHistory({ move: MoveId.SPLASH, targets: [BattlerIndex.ENEMY], useMode: MoveUseMode.NORMAL });
    game.scene.currentBattle.lastMove = MoveId.SPLASH;

    game.move.select(MoveId.DISABLE);
    await game.move.forceEnemyMove(moveId);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    const enemyMon = game.field.getEnemyPokemon();
    expect(enemyMon.isMoveRestricted(moveId), `calling move ${MoveId[moveId]} was not disabled`).toBe(true);
    expect(enemyMon.getLastXMoves(-1)).toHaveLength(2);
    const calledMove = enemyMon.getLastXMoves()[0].move;
    expect(
      enemyMon.isMoveRestricted(calledMove),
      `called move ${MoveId[calledMove]} (from ${MoveId[moveId]}) was incorrectly disabled`,
    ).toBe(false);
  });

  it("should ignore dancer copied moves, even if also in moveset", async () => {
    game.override
      .enemyAbility(AbilityId.DANCER)
      .moveset([MoveId.DISABLE, MoveId.SWORDS_DANCE])
      .enemyMoveset([MoveId.SPLASH, MoveId.SWORDS_DANCE]);
    await game.classicMode.startBattle([SpeciesId.PIKACHU]);

    game.move.select(MoveId.SWORDS_DANCE);
    await game.move.selectEnemyMove(MoveId.SPLASH);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(MoveId.DISABLE);
    await game.move.selectEnemyMove(MoveId.SWORDS_DANCE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    // Dancer-induced Swords Dance was ignored in favor of splash,
    // leaving the subsequent _normal_ swords dance free to work as normal
    const shuckle = game.field.getEnemyPokemon();
    expect.soft(shuckle.isMoveRestricted(MoveId.SPLASH)).toBe(true);
    expect.soft(shuckle.isMoveRestricted(MoveId.SWORDS_DANCE)).toBe(false);
    expect(shuckle.getLastXMoves()[0]).toMatchObject({ move: MoveId.SWORDS_DANCE, result: MoveResult.SUCCESS });
    expect(shuckle.getStatStage(Stat.ATK)).toBe(4);
  });
});
