import { AbilityId } from "#enums/ability-id";
import { BattleType } from "#enums/battle-type";
import { BattlerIndex } from "#enums/battler-index";
import { MoveId } from "#enums/move-id";
import { MoveResult } from "#enums/move-result";
import { SpeciesId } from "#enums/species-id";
import { GameManager } from "#test/test-utils/game-manager";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";

describe("Moves - Gastro Acid", () => {
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
      .battleStyle("single")
      .ability(AbilityId.BALL_FETCH)
      .startingLevel(1)
      .enemySpecies(SpeciesId.BIDOOF)
      .enemyMoveset(MoveId.SPLASH)
      .enemyAbility(AbilityId.WATER_ABSORB);
  });

  it("should suppress the target's ability", async () => {
    game.override.battleStyle("double");
    await game.classicMode.startBattle([SpeciesId.BIDOOF, SpeciesId.BASCULIN]);

    game.move.use(MoveId.GASTRO_ACID, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.SPLASH, BattlerIndex.PLAYER_2);
    await game.toNextTurn();

    const [enemy1, enemy2] = game.scene.getEnemyField();
    expect(enemy1.summonData.abilitySuppressed).toBe(true);
    expect(enemy2.summonData.abilitySuppressed).toBe(false);

    game.move.use(MoveId.WATER_GUN, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.use(MoveId.WATER_GUN, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);
    await game.toEndOfTurn();

    expect(enemy1.summonData.abilitySuppressed).toBe(true);
    expect(enemy2.summonData.abilitySuppressed).toBe(false);
    expect(enemy1.hp).toBeLessThan(enemy1.getMaxHp());
    expect(enemy2.hp).toBe(enemy2.getMaxHp());
  });

  it("should be removed on switch", async () => {
    game.override.battleType(BattleType.TRAINER);
    await game.classicMode.startBattle([SpeciesId.BIDOOF]);

    game.move.use(MoveId.GASTRO_ACID);
    await game.toNextTurn();

    const enemy = game.field.getEnemyPokemon();
    expect(enemy.summonData.abilitySuppressed).toBe(true);

    // switch enemy out and back in, should be removed
    game.move.use(MoveId.SPLASH);
    game.forceEnemyToSwitch();
    await game.toNextTurn();
    game.move.use(MoveId.SPLASH);
    game.forceEnemyToSwitch();
    await game.toNextTurn();

    expect(game.field.getEnemyPokemon()).toBe(enemy);
    expect(enemy.summonData.abilitySuppressed).toBe(false);
  });

  it("should fail if target's ability is already suppressed", async () => {
    await game.classicMode.startBattle([SpeciesId.BIDOOF]);

    game.move.use(MoveId.CORE_ENFORCER);
    // Force player to be slower to enable Core Enforcer to proc its suppression effect
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.use(MoveId.GASTRO_ACID);
    await game.toNextTurn();

    expect(game.field.getPlayerPokemon().getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });

  it("should suppress target's passive even if its main ability is unsuppressable", async () => {
    game.override.enemyAbility(AbilityId.COMATOSE).enemyPassiveAbility(AbilityId.WATER_ABSORB);
    await game.classicMode.startBattle([SpeciesId.MAGIKARP]);

    const enemyPokemon = game.field.getEnemyPokemon();

    game.move.use(MoveId.GASTRO_ACID);
    await game.toNextTurn();
    expect(enemyPokemon.summonData.abilitySuppressed).toBe(true);

    game.move.use(MoveId.WATER_GUN);
    await game.toNextTurn();
    // water gun should've dealt damage due to suppressed Water Absorb
    expect(enemyPokemon.hp).toBeLessThan(enemyPokemon.getMaxHp());

    game.move.use(MoveId.SPORE);
    await game.toEndOfTurn();

    // Comatose should block stauts effect
    expect(enemyPokemon.status?.effect).toBeUndefined();
  });
});
