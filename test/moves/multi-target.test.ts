import { AbilityId } from "#enums/ability-id";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { toDmgValue } from "#utils/common";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

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
      .criticalHits(false)
      .battleStyle("double")
      .enemyLevel(100)
      .startingLevel(100)
      .enemySpecies(SpeciesId.POLIWAG)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.BALL_FETCH)
      .moveset([MoveId.TACKLE, MoveId.DAZZLING_GLEAM, MoveId.EARTHQUAKE, MoveId.SPLASH])
      .ability(AbilityId.BALL_FETCH);
  });

  it("should reduce d.gleam damage when multiple enemies but not tackle", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.select(MoveId.DAZZLING_GLEAM);
    game.move.select(MoveId.TACKLE, 1, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);
    await game.phaseInterceptor.to("MoveEndPhase");

    const gleam1 = enemy1.getMaxHp() - enemy1.hp;
    enemy1.hp = enemy1.getMaxHp();

    await game.phaseInterceptor.to("MoveEndPhase");

    const tackle1 = enemy1.getMaxHp() - enemy1.hp;
    enemy1.hp = enemy1.getMaxHp();

    await game.killPokemon(enemy2);
    await game.toNextTurn();

    game.move.select(MoveId.DAZZLING_GLEAM);
    game.move.select(MoveId.TACKLE, 1, BattlerIndex.ENEMY);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");

    const gleam2 = enemy1.getMaxHp() - enemy1.hp;
    enemy1.hp = enemy1.getMaxHp();

    await game.phaseInterceptor.to("MoveEndPhase");
    const tackle2 = enemy1.getMaxHp() - enemy1.hp;

    // Single target moves don't get reduced
    expect(tackle1).toBe(tackle2);
    // Moves that target all enemies get reduced if there's more than one enemy
    expect(gleam1).toBeLessThanOrEqual(toDmgValue(gleam2 * 0.75) + 1);
    expect(gleam1).toBeGreaterThanOrEqual(toDmgValue(gleam2 * 0.75) - 1);
  });

  it("should reduce earthquake when more than one pokemon other than user is not fainted", async () => {
    await game.classicMode.startBattle([SpeciesId.MAGIKARP, SpeciesId.FEEBAS]);

    const player2 = game.scene.getPlayerParty()[1];
    const [enemy1, enemy2] = game.scene.getEnemyField();

    game.move.select(MoveId.EARTHQUAKE);
    game.move.select(MoveId.SPLASH, 1);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY, BattlerIndex.ENEMY_2]);

    await game.phaseInterceptor.to("MoveEndPhase");

    const damagePlayer2Turn1 = player2.getMaxHp() - player2.hp;
    const damageEnemy1Turn1 = enemy1.getMaxHp() - enemy1.hp;

    player2.hp = player2.getMaxHp();
    enemy1.hp = enemy1.getMaxHp();

    await game.killPokemon(enemy2);
    await game.toNextTurn();

    game.move.select(MoveId.EARTHQUAKE);
    game.move.select(MoveId.SPLASH, 1);
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

    game.move.select(MoveId.EARTHQUAKE);
    await game.setTurnOrder([BattlerIndex.PLAYER, BattlerIndex.ENEMY]);

    await game.phaseInterceptor.to("MoveEndPhase");

    const damageEnemy1Turn3 = enemy1.getMaxHp() - enemy1.hp;
    // Turn 3: 1 target, should be no damage reduction
    expect(damageEnemy1Turn1).toBeLessThanOrEqual(toDmgValue(damageEnemy1Turn3 * 0.75) + 1);
    expect(damageEnemy1Turn1).toBeGreaterThanOrEqual(toDmgValue(damageEnemy1Turn3 * 0.75) - 1);
  });
});
