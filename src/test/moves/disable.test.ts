import { BattlerIndex } from "#app/battle";
import { MoveResult } from "#app/field/pokemon";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Disable", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS
    });
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  beforeEach(async () => {
    game = new GameManager(phaserGame);
    game.override
      .battleType("single")
      .ability(Abilities.BALL_FETCH)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([Moves.DISABLE, Moves.SPLASH])
      .enemyMoveset(SPLASH_ONLY)
      .starterSpecies(Species.PIKACHU)
      .enemySpecies(Species.SHUCKLE);
  });

  it("restricts moves", async () => {
    await game.classicMode.startBattle();

    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyMon.getMoveHistory()).toHaveLength(1);
    expect(enemyMon.isMoveRestricted(Moves.SPLASH)).toBe(true);
  });

  it("fails if enemy has no move history", async() => {
    await game.classicMode.startBattle();

    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    expect(playerMon.getMoveHistory()[0]).toMatchObject({ move: Moves.DISABLE, result: MoveResult.FAIL });
    expect(enemyMon.isMoveRestricted(Moves.SPLASH)).toBe(false);
  }, 20000);

  it("causes STRUGGLE if all usable moves are disabled", async() => {
    await game.classicMode.startBattle();

    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    const enemyHistory = enemyMon.getMoveHistory();
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory[0].move).toBe(Moves.SPLASH);
    expect(enemyHistory[1].move).toBe(Moves.STRUGGLE);
  }, 20000);

  it("cannot disable STRUGGLE", async() => {
    game.override.enemyMoveset(Array(4).fill(Moves.STRUGGLE));
    await game.classicMode.startBattle();

    const playerMon = game.scene.getPlayerPokemon()!;
    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(playerMon.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
    expect(enemyMon.getLastXMoves()[0].move).toBe(Moves.STRUGGLE);
    expect(enemyMon.isMoveRestricted(Moves.STRUGGLE)).toBe(false);
  }, 20000);

  it("interrupts target's move when target moves after", async() => {
    await game.classicMode.startBattle();

    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.SPLASH);
    await game.toNextTurn();

    // Both mons just used Splash last turn; now have player use Disable.
    game.move.select(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);
    await game.toNextTurn();

    const enemyHistory = enemyMon.getMoveHistory();
    expect(enemyHistory).toHaveLength(2);
    expect(enemyHistory[0]).toMatchObject({ move: Moves.SPLASH, result: MoveResult.SUCCESS });
    expect(enemyHistory[1].result).toBe(MoveResult.FAIL);
  }, 20000);

  it("disables NATURE POWER, not the move invoked by it", async() => {
    game.override.enemyMoveset(Array(4).fill(Moves.NATURE_POWER));
    await game.classicMode.startBattle();

    const enemyMon = game.scene.getEnemyPokemon()!;

    game.move.select(Moves.DISABLE);
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    expect(enemyMon.isMoveRestricted(Moves.NATURE_POWER)).toBe(true);
    expect(enemyMon.isMoveRestricted(enemyMon.getLastXMoves(2)[1].move)).toBe(false);
  }, 20000);
});
