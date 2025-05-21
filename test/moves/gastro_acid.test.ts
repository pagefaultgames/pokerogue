import { BattlerIndex } from "#app/battle";
import { Abilities } from "#app/enums/abilities";
import { Moves } from "#app/enums/moves";
import { Species } from "#app/enums/species";
import { MoveResult } from "#app/field/pokemon";
import { BattleType } from "#enums/battle-type";
import GameManager from "#test/testUtils/gameManager";
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
      .battleStyle("double")
      .ability(Abilities.SLOW_START)
      .startingLevel(1)
      .moveset([Moves.GASTRO_ACID, Moves.WATER_GUN, Moves.SPLASH, Moves.CORE_ENFORCER])
      .enemySpecies(Species.BIDOOF)
      .enemyMoveset(Moves.SPLASH)
      .enemyAbility(Abilities.WATER_ABSORB);
  });

  it("should suppress the target's ability", async () => {
    /*
     * Expected flow (enemies have WATER ABSORD, can only use SPLASH)
     * - player mon 1 uses GASTRO ACID, player mon 2 uses SPLASH
     * - both player mons use WATER GUN on their respective enemy mon
     * - player mon 1 should have dealt damage, player mon 2 should have not
     */

    await game.classicMode.startBattle([Species.BIDOOF, Species.BASCULIN]);

    game.move.select(Moves.GASTRO_ACID, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.SPLASH, BattlerIndex.PLAYER_2);

    // TODO: Change once `game.toNextTurn` is fixed
    await game.phaseInterceptor.to("TurnInitPhase");

    const [enemy1, enemy2] = game.scene.getEnemyField();
    expect(enemy1.summonData.abilitySuppressed).toBe(true);
    expect(enemy2.summonData.abilitySuppressed).toBe(false);

    game.move.select(Moves.WATER_GUN, BattlerIndex.PLAYER, BattlerIndex.ENEMY);
    game.move.select(Moves.WATER_GUN, BattlerIndex.PLAYER_2, BattlerIndex.ENEMY_2);

    await game.phaseInterceptor.to("TurnEndPhase");

    expect(enemy1.summonData.abilitySuppressed).toBe(true);
    expect(enemy2.summonData.abilitySuppressed).toBe(false);
    expect(enemy1.hp).not.toBe(enemy1.getMaxHp());
    expect(enemy2.hp).toBe(enemy2.getMaxHp());
  });

  it("should be removed on switch", async () => {
    game.override.battleStyle("single").battleType(BattleType.TRAINER);
    await game.classicMode.startBattle([Species.BIDOOF]);

    game.move.select(Moves.GASTRO_ACID);
    await game.toNextTurn();

    const enemy = game.scene.getEnemyPokemon()!;
    expect(enemy.summonData.abilitySuppressed).toBe(true);

    // switch enemy out and back in, should be removed
    game.move.select(Moves.SPLASH);
    game.forceEnemyToSwitch();
    await game.toNextTurn();
    game.move.select(Moves.SPLASH);
    game.forceEnemyToSwitch();
    await game.toNextTurn();

    expect(game.scene.getEnemyPokemon()).toBe(enemy);
    expect(enemy.summonData.abilitySuppressed).toBe(false);
  });

  it("should fail if target's ability is already suppressed", async () => {
    game.override.battleStyle("single");
    await game.classicMode.startBattle([Species.BIDOOF]);

    game.move.select(Moves.CORE_ENFORCER);
    // Force player to be slower to enable Core Enforcer to proc its suppression effect
    await game.setTurnOrder([BattlerIndex.ENEMY, BattlerIndex.PLAYER]);
    await game.toNextTurn();

    game.move.select(Moves.GASTRO_ACID);
    await game.toNextTurn();

    expect(game.scene.getPlayerPokemon()!.getLastXMoves()[0].result).toBe(MoveResult.FAIL);
  });
});
