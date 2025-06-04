import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
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
      .ability(AbilityId.BALL_FETCH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([MoveId.DISABLE, MoveId.SPLASH])
      .enemyMoveset(MoveId.SPLASH)
      .starterSpecies(SpeciesId.PIKACHU)
      .enemySpecies(SpeciesId.SHUCKLE);
  });

  it("restricts moves", async () => {
    await game.classicMode.startBattle();

    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyMon.getMoveHistory()).toHaveLength(1);
    expect(enemyMon.isMoveRestricted(MoveId.SPLASH)).toBe(true);
  });

  it("fails if enemy has no move history", async () => {
    await game.classicMode.startBattle();

    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(playerMon.getMoveHistory()[0]).toMatchObject({
      move: MoveId.DISABLE,
      result: MoveResult.FAIL,
    });
    expect(enemyMon.isMoveRestricted(MoveId.SPLASH)).toBe(false);
  }, 20000);

  it("causes STRUGGLE if all usable moves are disabled", async () => {
    await game.classicMode.startBattle();

    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    const enemyHistory = enemyMon.getMoveHistory();
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory[0].move).toBe(MoveId.SPLASH);
    expect(enemyHistory[1].move).toBe(MoveId.STRUGGLE);
  }, 20000);

  it("cannot disable STRUGGLE", async () => {
    game.override.enemyMoveset([MoveId.STRUGGLE]);
    await game.classicMode.startBattle();

    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(playerMon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(enemyMon.getLastXMoves()[0].move).toBe(MoveId.STRUGGLE);
    expect(enemyMon.isMoveRestricted(MoveId.STRUGGLE)).toBe(false);
  }, 20000);

  it("interrupts target's move when target moves after", async () => {
    await game.classicMode.startBattle();

    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.SPLASH);
    await game.toNextTurn();

    // Both mons just used Splash last turn; now have player use Disable.
    game.move.select(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const enemyHistory = enemyMon.getMoveHistory();
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory[0]).toMatchObject({
      move: MoveId.SPLASH,
      result: MoveResult.SUCCESS,
    });
    expect(enemyHistory[1].result).toBe(MoveResult.FAIL);
  }, 20000);

  it("disables NATURE POWER, not the move invoked by it", async () => {
    game.override.enemyMoveset([MoveId.NATURE_POWER]);
    await game.classicMode.startBattle();

    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyMon.isMoveRestricted(MoveId.NATURE_POWER)).toBe(true);
    expect(enemyMon.isMoveRestricted(enemyMon.getLastXMoves(2)[0].move)).toBe(false);
  }, 20000);

  it("disables most recent move", async () => {
    game.override.enemyMoveset([MoveId.SPLASH, MoveId.TACKLE]);
    await game.classicMode.startBattle();

    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(MoveId.SPLASH);
    await game.move.selectEnemyMove(MoveId.SPLASH, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(MoveId.DISABLE);
    await game.move.selectEnemyMove(MoveId.TACKLE, BattlerIndex.PLAYER);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyMon.isMoveRestricted(MoveId.TACKLE)).toBe(true);
    expect(enemyMon.isMoveRestricted(MoveId.SPLASH)).toBe(false);
  }, 20000);
});
