import { BattlerIndex } from "#app/battle";
import { Abilities } from "#app/enums/abilities";
import { Species } from "#app/enums/species";
import * as Utils from "#app/utils";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import { SPLASH_ONLY } from "#test/utils/testUtils";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

const TIMEOUT = 20 * 1000;

describe("Multi-target damage reduction", () => {
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
      .disableCrits()
      .battleType("double")
      .enemyLevel(100)
      .startingLevel(100)
      .enemySpecies(Species.POLIWAG)
      .enemyMoveset(SPLASH_ONLY)
      .enemyAbility(Abilities.BALL_FETCH)
      .moveset([Moves.TACKLE, Moves.DAZZLING_GLEAM, Moves.EARTHQUAKE, Moves.SPLASH])
      .ability(Abilities.BALL_FETCH);
  });

  it("should reduce d.gleam damage when multiple enemies but not tackle", async () => {
    await game.startBattle([Species.MAGIKARP, Species.FEEBAS]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.select(Moves.DAZZLING_GLEAM);
    game.move.select(Moves.TACKLE, 1, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MoveEndPhase");

    const gleam1 = enemy1.getMaxHp() - enemy1.hp;
    enemy1.hp = enemy1.getMaxHp();

    await game.phaseInterceptor.to("MoveEndPhase");

    const tackle1 = enemy1.getMaxHp() - enemy1.hp;
    enemy1.hp = enemy1.getMaxHp();

    await game.killPokemon(enemy2);
    await game.toNextTurn();

    game.move.select(Moves.DAZZLING_GLEAM);
    game.move.select(Moves.TACKLE, 1, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");

    const gleam2 = enemy1.getMaxHp() - enemy1.hp;
    enemy1.hp = enemy1.getMaxHp();

    await game.phaseInterceptor.to("MoveEndPhase");
    const tackle2 = enemy1.getMaxHp() - enemy1.hp;

    // Single target moves don't get reduced
    expect(tackle1).toBe(tackle2);
    // Moves that target all enemies get reduced if there's more than one enemy
    expect(gleam1).toBeLessThanOrEqual(Utils.toDmgValue(gleam2 * 0.75) + 1);
    expect(gleam1).toBeGreaterThanOrEqual(Utils.toDmgValue(gleam2 * 0.75) - 1);
  }, TIMEOUT);

  it("should reduce earthquake when more than one pokemon other than user is not fainted", async () => {
    await game.startBattle([Species.MAGIKARP, Species.FEEBAS]);

    const player2 = game.scene.getParty()[1];
    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.select(Moves.EARTHQUAKE);
    game.move.select(Moves.SPLASH, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase");

    const damagePlayer2Turn1 = player2.getMaxHp() - player2.hp;
    const damageEnemy1Turn1 = enemy1.getMaxHp() - enemy1.hp;

    player2.hp = player2.getMaxHp();
    enemy1.hp = enemy1.getMaxHp();

    await game.killPokemon(enemy2);
    await game.toNextTurn();

    game.move.select(Moves.EARTHQUAKE);
    game.move.select(Moves.SPLASH, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");

    const damagePlayer2Turn2 = player2.getMaxHp() - player2.hp;
    const damageEnemy1Turn2 = enemy1.getMaxHp() - enemy1.hp;

    enemy1.hp = enemy1.getMaxHp();

    // Turn 1: 3 targets, turn 2: 2 targets
    // Both should have damage reduction
    expect(damageEnemy1Turn1).toBe(damageEnemy1Turn2);
    expect(damagePlayer2Turn1).toBe(damagePlayer2Turn2);

    await game.killPokemon(player2);
    await game.toNextTurn();

    game.move.select(Moves.EARTHQUAKE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");

    const damageEnemy1Turn3 = enemy1.getMaxHp() - enemy1.hp;
    // Turn 3: 1 target, should be no damage reduction
    expect(damageEnemy1Turn1).toBeLessThanOrEqual(Utils.toDmgValue(damageEnemy1Turn3 * 0.75) + 1);
    expect(damageEnemy1Turn1).toBeGreaterThanOrEqual(Utils.toDmgValue(damageEnemy1Turn3 * 0.75) - 1);
  }, TIMEOUT);
});
